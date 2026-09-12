import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateOTP, normalizePhoneNumber, sendOtpWhatsApp } from "@/lib/whatsapp";

// N6 · WAME-INVERSE — inscription livreur par wa.me (le livreur écrit à LIVRA).
// L'inscription en attente vit dans `driver_otps` (staging, onConflict whatsapp) + 4 colonnes
// wa_* (migration 039, additive). Ce module regroupe : génération token/lien, préséance
// acheteur, et le handler de message entrant côté livreur. Best-effort : ne throw jamais.

export const WA_INBOUND_NUMBER = "213652208485"; // le numéro WhatsApp LIVRA (cf. contact page)
const WA_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h — fenêtre pour écrire à LIVRA
const OTP_TTL_MS = 10 * 60 * 1000; // 10 min — durée de vie de l'OTP une fois envoyé
const ANTISPAM_MAX = 3; // max envois de code
const ANTISPAM_WINDOW_MS = 60 * 60 * 1000; // par numéro / heure (fenêtre fixe durable)

const TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TOKEN_LEN = 7; // dans [6..8] imposé par le contrat
const TOKEN_RE = /LIVRA\s*([A-Z0-9]{6,8})/i;

export function generateWaToken(): string {
  const bytes = crypto.randomBytes(TOKEN_LEN);
  let out = "";
  for (let i = 0; i < TOKEN_LEN; i++) out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return out;
}

export function waTokenExpiry(): string {
  return new Date(Date.now() + WA_TOKEN_TTL_MS).toISOString();
}

export function waLink(token: string): string {
  return `https://wa.me/${WA_INBOUND_NUMBER}?text=` + encodeURIComponent(`LIVRA ${token}`);
}

function hashOtp(otp: string, phone: string): string {
  return crypto.createHash("sha256").update(otp + phone).digest("hex");
}

// Numéro masqué pour les logs (jamais le numéro complet en clair).
function mask(phone: string): string {
  const n = normalizePhoneNumber(phone);
  return n.length < 7 ? "***" : n.slice(0, 5) + "XXXXX" + n.slice(-2);
}

// Préséance acheteur : ce numéro a-t-il une commande en attente d'OTP ? (mêmes critères que
// le tunnel confirm-order). Si oui, l'inscription livreur cède le pas (cas rare : un livreur
// qui est AUSSI en train de confirmer un achat). Filtre téléphone en JS (formats variables).
export async function hasActiveBuyerOtp(supabase: SupabaseClient, fromPhone: string): Promise<boolean> {
  const phoneNorm = normalizePhoneNumber(fromPhone);
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("orders")
    .select("id, client:clients(phone)")
    .not("otp_code", "is", null)
    .is("otp_verified_at", null)
    .gt("otp_expires_at", nowIso);
  const rows = (data ?? []) as { client: { phone: string } | { phone: string }[] | null }[];
  return rows.some((o) => {
    const c = Array.isArray(o.client) ? o.client[0] : o.client;
    return !!c && normalizePhoneNumber(c.phone) === phoneNorm;
  });
}

type PendingReg = {
  id: string;
  prenom: string;
  whatsapp: string;
  wa_send_count: number | null;
  wa_send_window_start: string | null;
};

// Traite un message entrant comme une inscription livreur wa.me.
//   handled=true  → c'ÉTAIT une inscription (code envoyé, OU silence anti-spam/erreur) : le
//                   webhook NE retombe PAS sur le tunnel acheteur.
//   handled=false → aucune inscription en attente ne correspond → le webhook enchaîne l'acheteur.
// Best-effort : ne throw jamais (le webhook répond toujours 200).
export async function handleDriverInboundRegistration(
  supabase: SupabaseClient,
  fromPhone: string,
  body: string
): Promise<{ handled: boolean }> {
  const incoming = normalizePhoneNumber(fromPhone);
  const nowIso = new Date().toISOString();
  const cols = "id, prenom, whatsapp, wa_send_count, wa_send_window_start";

  // 1. Retrouver l'inscription en attente : par TOKEN d'abord (robuste), sinon par NUMÉRO
  //    entrant (fallback si le texte « LIVRA <token> » a été modifié). Uniquement les lignes
  //    wa.me en attente (wa_token non NULL, wa_token_expires_at > now) — jamais un OTP acheteur/ancien flux.
  let reg: PendingReg | null = null;
  const m = body.match(TOKEN_RE);
  if (m) {
    const token = m[1].toUpperCase();
    const { data } = await supabase
      .from("driver_otps")
      .select(cols)
      .eq("wa_token", token)
      .gt("wa_token_expires_at", nowIso)
      .maybeSingle();
    reg = (data as PendingReg | null) ?? null;
  }
  if (!reg) {
    const { data } = await supabase
      .from("driver_otps")
      .select(cols)
      .eq("whatsapp", incoming)
      .not("wa_token", "is", null)
      .gt("wa_token_expires_at", nowIso)
      .maybeSingle();
    reg = (data as PendingReg | null) ?? null;
  }
  if (!reg) return { handled: false }; // pas une inscription → tunnel acheteur

  // 2. Anti-spam durable : max 3 envois / numéro / heure (fenêtre fixe).
  const windowStartMs = reg.wa_send_window_start ? new Date(reg.wa_send_window_start).getTime() : 0;
  const inWindow = Date.now() - windowStartMs < ANTISPAM_WINDOW_MS;
  const count = inWindow ? reg.wa_send_count ?? 0 : 0;
  if (count >= ANTISPAM_MAX) {
    console.error(`[driver-wame] anti-spam ${mask(incoming)} : ${count} envois dans l'heure → silence`);
    return { handled: true }; // c'était bien une inscription : on ne retombe pas sur l'acheteur
  }

  // 3. OTP frais haché pour le numéro ENTRANT (il fait foi → écrase le numéro du form s'il
  //    diffère). expires_at = fenêtre OTP 10 min ; le compteur anti-spam est incrémenté.
  const otp = generateOTP();
  const { error: updErr } = await supabase
    .from("driver_otps")
    .update({
      whatsapp: incoming,
      otp_hash: hashOtp(otp, incoming),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      wa_send_count: count + 1,
      wa_send_window_start: inWindow ? reg.wa_send_window_start : nowIso,
    })
    .eq("id", reg.id);
  if (updErr) {
    // Ex. le numéro entrant collisionne avec une AUTRE ligne (whatsapp UNIQUE) — cas rare.
    console.error(`[driver-wame] update inscription ${mask(incoming)} échoué:`, updErr.message);
    return { handled: true };
  }

  // 4. Envoi de l'OTP en MESSAGE LIBRE (fenêtre 24h ouverte par le message entrant du livreur).
  //    sendOtpWhatsApp = texte FR livreur (buildOtpMessage), JAMAIS le template acheteur order_otp_code.
  const r = await sendOtpWhatsApp(incoming, reg.prenom, otp);
  if (!r.success) console.error(`[driver-wame] envoi OTP ${mask(incoming)} échoué:`, r.error);
  return { handled: true };
}
