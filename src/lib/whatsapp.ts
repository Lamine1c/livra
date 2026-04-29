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
async function sendViaMeta(to: string, clientName: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;

  const body = templateName
    ? buildTemplatePayload(to, templateName, clientName, otp)
    : buildTextPayload(to, clientName, otp);

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
export async function sendOtpWhatsApp(
  phone: string,
  clientName: string,
  otp: string
): Promise<WhatsAppResult> {
  const to = normalizePhoneNumber(phone);
  const masked = maskedPhone(phone);
  const message = `Bonjour ${clientName} !\n\nVotre code de confirmation LIVRA est :\n\n*${otp}*\n\nCe code expire dans 10 minutes. Ne le communiquez à personne.`;

  // Twilio disponible → on l'utilise
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const result = await sendViaTwilio(to, message);
    return { success: result.ok, maskedPhone: masked, error: result.error };
  }

  // Fallback Meta
  const result = await sendViaMeta(to, clientName, otp);
  return { success: result.ok, maskedPhone: masked, error: result.error };
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
    body: JSON.stringify(buildTextPayload(to, "", message)),
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

function buildTextPayload(to: string, _clientName: string, message: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message },
  };
}
