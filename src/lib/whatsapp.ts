import crypto from "crypto";
import {
  buildTemplatePayload,
  buildInteractiveButtonsPayload,
  renderTemplateText,
  TEMPLATES,
  type WhatsAppTemplate,
} from "./whatsapp-templates";

// Transport WhatsApp = Meta Cloud API (Meta Step 2 terminé).
// Graph API version alignée sur lib/meta.ts (v26.0). PHONE_NUMBER_ID = env
// WHATSAPP_PHONE_NUMBER_ID, source UNIQUE : pas de fallback hardcodé (un id figé
// a déjà bité — id périmé). Absent/vide → on ne construit pas d'URL et l'envoi
// échoue proprement, plutôt que d'envoyer vers un id erroné en silence.
const GRAPH_VERSION = "v26.0";

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

// Masque un numéro pour les logs — format DZ « 0X ** ** XX XX ». Jamais en clair.
export function maskPhoneForLog(phone: string): string {
  const n = normalizePhoneNumber(phone);
  const local = n.startsWith("213") ? "0" + n.slice(3) : n.startsWith("0") ? n : "0" + n;
  if (local.length < 10) return "0* ** ** ** **";
  return `${local.slice(0, 2)} ** ** ${local.slice(6, 8)} ${local.slice(8, 10)}`;
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
async function postToMeta(payload: object, label: string): Promise<{ ok: boolean; error?: string; code?: number; wamid?: string }> {
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

  const data = (await res.json().catch(() => null)) as {
    error?: { message?: string; code?: number };
    messages?: Array<{ id?: string }>;
  } | null;

  if (!res.ok) {
    console.error("[Meta WhatsApp] échec", { label, status: res.status, error: data?.error });
    return { ok: false, error: data?.error?.message ?? `Meta error ${res.status}`, code: data?.error?.code };
  }
  return { ok: true, wamid: data?.messages?.[0]?.id };
}

// Codes Meta signalant que la fenêtre de service 24h est fermée → un message de session
// (texte/interactif) est refusé, seul un TEMPLATE approuvé passe. 131047 = "Re-engagement
// message" (canonique), 470 = variante legacy re-engagement.
const OUT_OF_WINDOW_CODES = new Set([131047, 470]);
function isOutOfWindow(code?: number): boolean {
  return code != null && OUT_OF_WINDOW_CODES.has(code);
}

async function sendMetaText(to: string, message: string): Promise<{ ok: boolean; error?: string; code?: number }> {
  return postToMeta(buildTextPayload(to, message), "text");
}

// Envoi d'un TEMPLATE Meta approuvé (message business-initiated, hors fenêtre 24h).
// Un template encore "In review" échoue PROPREMENT ici (Meta renvoie une erreur,
// loggée, non bloquante) jusqu'à son approbation — aucun crash côté flux métier.
export async function sendWhatsAppTemplate(
  phone: string,
  template: WhatsAppTemplate,
  variables: string[]
): Promise<{ success: boolean; error?: string; wamid?: string }> {
  const to = normalizePhoneNumber(phone);
  const payload = buildTemplatePayload(to, template, variables);
  const result = await postToMeta(payload, `template:${template.name}`);
  return { success: result.ok, error: result.error, wamid: result.wamid };
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
): Promise<{ success: boolean; error?: string; code?: number }> {
  const to = normalizePhoneNumber(phone);
  const result = await sendMetaText(to, message);
  return { success: result.ok, error: result.error, code: result.code };
}

function buildTextPayload(to: string, message: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message },
  };
}

// ─── MESSAGE INTERACTIF À BOUTONS (fenêtre 24h) ───────────────
// Reply buttons WhatsApp Cloud API. Délivré UNIQUEMENT dans la fenêtre 24h (comme le
// texte libre) : le tunnel l'appelle en réponse à un message ENTRANT du client. Hors
// fenêtre → repli template quick-reply (sendWhatsAppTemplate). Corps + boutons dérivés
// du template (renderTemplateText + template.buttons) — même signature que sendWhatsAppTemplate.
export async function sendWhatsAppInteractiveButtons(
  phone: string,
  template: WhatsAppTemplate,
  variables: string[]
): Promise<{ success: boolean; error?: string; code?: number; wamid?: string }> {
  const to = normalizePhoneNumber(phone);
  const body = renderTemplateText(template, variables);
  const payload = buildInteractiveButtonsPayload(to, body, template.buttons ?? []);
  const result = await postToMeta(payload, `interactive:${template.name}`);
  return { success: result.ok, error: result.error, code: result.code, wamid: result.wamid };
}

// ─── ENVOI TUNNEL : fenêtre 24h d'abord, repli TEMPLATE hors fenêtre ──────────
// Chaque message conversationnel du tunnel (confirm-order) est une RÉPONSE à un message
// entrant → la fenêtre 24h est normalement ouverte. Ce helper tente d'abord le chemin de
// session (interactif si le template a des boutons ET opts.interactive, sinon texte libre) ;
// si Meta refuse pour fenêtre fermée (isOutOfWindow), il bascule sur le TEMPLATE approuvé
// (sendWhatsAppTemplate — quick-reply pour les boutons). `viaTemplate` = true si repli.
// Le template de repli doit être approuvé côté Meta (voir tasks/TEMPLATES_A_SOUMETTRE.md) ;
// tant qu'il ne l'est pas, le repli échoue PROPREMENT (loggé, non bloquant) comme aujourd'hui.
export async function sendTunnelMessage(
  phone: string,
  template: WhatsAppTemplate,
  variables: string[],
  opts?: { interactive?: boolean }
): Promise<{ success: boolean; error?: string; viaTemplate?: boolean }> {
  const windowResult =
    opts?.interactive && (template.buttons?.length ?? 0) > 0
      ? await sendWhatsAppInteractiveButtons(phone, template, variables)
      : await sendWhatsAppNotification(phone, renderTemplateText(template, variables));

  if (windowResult.success) return { success: true };

  if (isOutOfWindow(windowResult.code)) {
    const t = await sendWhatsAppTemplate(phone, template, variables);
    return { success: t.success, error: t.error, viaTemplate: true };
  }
  return { success: false, error: windowResult.error };
}

// ─── [N12-4] order_otp_code v2 — template Meta AUTHENTICATION (préparation, NON soumis) ──
// Meta force la catégorie Authentication pour les OTP → order_otp_code ne peut PAS partir en
// UTILITY. Ce helper construit le payload d'un template Authentication (composant body + bouton
// OTP « Copy code », cf. finding N13-bis ci-dessous). Nom + langue du template = env.
// Jamais appelé tant que AUTH_OTP_TEMPLATE_READY !== "true" (cf. tasks/TEMPLATES_A_SOUMETTRE.md).
const AUTH_OTP_TEMPLATE_NAME = process.env.WHATSAPP_OTP_AUTH_TEMPLATE_NAME ?? "order_otp_code";
const AUTH_OTP_TEMPLATE_LANG = process.env.WHATSAPP_OTP_AUTH_TEMPLATE_LANG ?? "fr";

function buildAuthTemplatePayload(to: string, code: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: AUTH_OTP_TEMPLATE_NAME,
      language: { code: AUTH_OTP_TEMPLATE_LANG },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        // [N13-bis] FINDING SOUMISSION CONFIRMÉ (Claudy, 16 sept) : bouton « Copy code » (l'acheteur
        // n'a PAS l'app LIVRA → il recopie le code par WhatsApp, PAS de one-tap/zero-tap) → le composant
        // bouton d'envoi est sub_type "copy_code" (index 0), param = coupon_code portant le code. (≠ "url".)
        { type: "button", sub_type: "copy_code", index: "0", parameters: [{ type: "coupon_code", coupon_code: code }] },
      ],
    },
  };
}

export async function sendWhatsAppAuthTemplate(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string; code?: number }> {
  const to = normalizePhoneNumber(phone);
  const result = await postToMeta(buildAuthTemplatePayload(to, code), `auth-template:${AUTH_OTP_TEMPLATE_NAME}`);
  return { success: result.ok, error: result.error, code: result.code };
}

// MSG 2 (code OTP) — fenêtre 24h → texte libre (order_otp_code bilingue). Hors fenêtre → repli :
// SI env AUTH_OTP_TEMPLATE_READY==="true" → template AUTHENTICATION (sendWhatsAppAuthTemplate) ;
// SINON → template classique (échoue tant que non approuvé = comportement ACTUEL, DÉFAUT texte-libre).
export async function sendOtpTunnelMessage(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string; viaAuthTemplate?: boolean }> {
  const windowResult = await sendWhatsAppNotification(phone, renderTemplateText(TEMPLATES.order_otp_code, [code]));
  if (windowResult.success) return { success: true };
  if (isOutOfWindow(windowResult.code)) {
    if (process.env.AUTH_OTP_TEMPLATE_READY === "true") {
      const t = await sendWhatsAppAuthTemplate(phone, code);
      return { success: t.success, error: t.error, viaAuthTemplate: true };
    }
    const t = await sendWhatsAppTemplate(phone, TEMPLATES.order_otp_code, [code]);
    return { success: t.success, error: t.error };
  }
  return { success: false, error: windowResult.error };
}
