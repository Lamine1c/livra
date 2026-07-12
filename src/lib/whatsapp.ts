import crypto from "crypto";
import { buildTemplatePayload, type WhatsAppTemplate } from "./whatsapp-templates";

// Transport WhatsApp = Meta Cloud API (Twilio retiré — Meta Step 2 terminé).
// Graph API version alignée sur lib/meta.ts (v23.0). PHONE_NUMBER_ID = env
// WHATSAPP_PHONE_NUMBER_ID, source UNIQUE : pas de fallback hardcodé (un id figé
// a déjà bité — id périmé). Absent/vide → on ne construit pas d'URL et l'envoi
// échoue proprement, plutôt que d'envoyer vers un id erroné en silence.
const GRAPH_VERSION = "v23.0";

function graphMessagesUrl(): string | null {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) return null;
  return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`;
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed.slice(1).replace(/\D/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return "213" + digits.slice(1);
  if (digits.length === 9) return "213" + digits;
  return digits;
}

function maskedPhone(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return "+" + normalized.slice(0, 5) + "XXXXX" + normalized.slice(-2);
}

interface WhatsAppResult {
  success: boolean;
  maskedPhone: string;
  error?: string;
}

// ─── ENVOI via Meta Cloud API (texte ou template) ─────────────
// ⚠️ Fenêtre 24h : un message TEXTE "de service" n'est délivré que dans les 24h
// suivant un message ENTRANT du client. Hors fenêtre (business-initiated), Meta
// exige un TEMPLATE approuvé. On ne logge JAMAIS de PII : status + erreur Meta.
async function postToMeta(payload: object, label: string): Promise<{ ok: boolean; error?: string }> {
  const url = graphMessagesUrl();
  if (!url) return { ok: false, error: "WHATSAPP_PHONE_NUMBER_ID manquant" };
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "WHATSAPP_ACCESS_TOKEN manquant" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;

  if (!res.ok) {
    console.error("[Meta WhatsApp] échec", { label, status: res.status, error: data?.error });
    return { ok: false, error: data?.error?.message ?? `Meta error ${res.status}` };
  }
  return { ok: true };
}

async function sendMetaText(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  return postToMeta(buildTextPayload(to, message), "text");
}

// Envoi d'un TEMPLATE Meta approuvé (message business-initiated, hors fenêtre 24h).
// Un template encore "In review" échoue PROPREMENT ici (Meta renvoie une erreur,
// loggée, non bloquante) jusqu'à son approbation — aucun crash côté flux métier.
export async function sendWhatsAppTemplate(
  phone: string,
  template: WhatsAppTemplate,
  variables: string[]
): Promise<{ success: boolean; error?: string }> {
  const to = normalizePhoneNumber(phone);
  const payload = buildTemplatePayload(to, template, variables);
  const result = await postToMeta(payload, `template:${template.name}`);
  return { success: result.ok, error: result.error };
}

// ─── SEND OTP (message business-initiated → template requis hors fenêtre) ──
export interface OtpMessageContext {
  boutique?: string;
  total?: number;
  produit?: string | null;
}

export async function sendOtpWhatsApp(
  phone: string,
  clientName: string,
  otp: string,
  ctx?: OtpMessageContext
): Promise<WhatsAppResult> {
  const to = normalizePhoneNumber(phone);
  const masked = maskedPhone(phone);
  const message = buildOtpMessage(clientName, otp, ctx);

  const result = await sendMetaText(to, message);
  return { success: result.ok, maskedPhone: masked, error: result.error };
}

// Copy V1 — le client répond avec le code pour confirmer (flux conversationnel).
function formatTotal(total?: number): string {
  if (total == null || Number.isNaN(total)) return "";
  return new Intl.NumberFormat("fr-FR").format(Math.round(total));
}

function buildOtpMessage(clientName: string, otp: string, ctx?: OtpMessageContext): string {
  const boutique = ctx?.boutique?.trim() || "votre vendeur";
  const totalTxt = formatTotal(ctx?.total);
  const produit = ctx?.produit?.trim();
  const ligneProduit = produit ? `${produit} — ${totalTxt} DA` : `${totalTxt} DA`;
  return (
    `Bonjour ${clientName} 👋\n\n` +
    `Votre commande chez ${boutique} est réservée à votre nom :\n` +
    `${ligneProduit}\n` +
    `Paiement à la livraison, rien à payer maintenant.\n\n` +
    `Pour la confirmer et qu'on vous l'envoie, répondez à ce message avec ce code :\n\n` +
    `✅ ${otp}\n\n` +
    `Sans ce code, on ne peut pas vous l'envoyer. On attend votre réponse 🙂`
  );
}

// ─── NOTIFICATION GÉNÉRIQUE (statuts, tracking, réponses tunnel) ──────────
// Texte libre via Meta. Délivré uniquement dans la fenêtre 24h (réponses aux
// messages entrants du client). Les notifications business-initiated hors
// fenêtre (crons, livraison) échoueront tant que les templates ne sont pas
// approuvés (voir rapport transport).
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const to = normalizePhoneNumber(phone);
  const result = await sendMetaText(to, message);
  return { success: result.ok, error: result.error };
}

function buildTextPayload(to: string, message: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message },
  };
}
