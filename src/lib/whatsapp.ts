import crypto from "crypto";

const PHONE_NUMBER_ID = "1081472725051661";
const GRAPH_API_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

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

// ─── TWILIO ───────────────────────────────────────────────
async function sendViaTwilio(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const toFormatted = `whatsapp:+${to}`;

  const body = new URLSearchParams({
    From: from,
    To: toFormatted,
    Body: message,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  console.log("[Twilio API]", { status: res.status, body: data });

  if (!res.ok) {
    return { ok: false, error: data?.message ?? "Twilio error" };
  }
  return { ok: true };
}

// ─── META ─────────────────────────────────────────────────
async function sendViaMeta(to: string, clientName: string, otp: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;

  const body = templateName
    ? buildTemplatePayload(to, templateName, clientName, otp)
    : buildTextPayload(to, message);

  const res = await fetch(GRAPH_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log("[Meta WhatsApp API]", { status: res.status, body: data });

  if (!res.ok) {
    return { ok: false, error: data?.error?.message ?? "Meta error" };
  }
  return { ok: true };
}

// ─── SEND OTP (auto-switch Twilio → Meta) ─────────────────
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

  // Twilio disponible → on l'utilise
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const result = await sendViaTwilio(to, message);
    return { success: result.ok, maskedPhone: masked, error: result.error };
  }

  // Fallback Meta (et futur 360dialog : même payload texte)
  const result = await sendViaMeta(to, clientName, otp, message);
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
    `Bonjour ${clientName} 👋\n` +
    ` Votre commande chez ${boutique} est réservée à votre nom :\n` +
    ` ${ligneProduit} · paiement à la livraison, rien à payer maintenant.\n` +
    ` Pour la confirmer et qu'on vous l'envoie, répondez à ce message avec ce code :\n` +
    ` ✅ ${otp}\n` +
    ` Sans ce code, on ne peut pas vous l'envoyer. On attend votre réponse 🙂`
  );
}

// ─── NOTIFICATION GÉNÉRIQUE (statuts, tracking) ───────────
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const to = normalizePhoneNumber(phone);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const result = await sendViaTwilio(to, message);
    return { success: result.ok, error: result.error };
  }

  // Meta fallback — text simple
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const res = await fetch(GRAPH_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildTextPayload(to, message)),
  });

  return { success: res.ok };
}

function buildTemplatePayload(to: string, templateName: string, clientName: string, otp: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "fr" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: clientName },
            { type: "text", text: otp },
          ],
        },
      ],
    },
  };
}

function buildTextPayload(to: string, message: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message },
  };
}
