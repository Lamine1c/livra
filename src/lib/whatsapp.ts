import crypto from "crypto";

const PHONE_NUMBER_ID = "1117086038154592";
const GRAPH_API_URL = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

export function generateOTP(): string {
  // Cryptographically secure 6-digit code
  return crypto.randomInt(100000, 999999).toString();
}

// Normalise un numéro algérien vers E.164 sans "+" (ex: 213XXXXXXXXX)
export function normalizeAlgerianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "213" + digits.slice(1);
  if (digits.length === 9) return "213" + digits;
  return digits;
}

function maskedPhone(phone: string): string {
  const normalized = normalizeAlgerianPhone(phone);
  return "+" + normalized.slice(0, 5) + "XXXXX" + normalized.slice(-2);
}

interface WhatsAppResult {
  success: boolean;
  maskedPhone: string;
  error?: string;
}

export async function sendOtpWhatsApp(
  phone: string,
  clientName: string,
  otp: string
): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  const to = normalizeAlgerianPhone(phone);

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

  if (!res.ok) {
    const msg = data?.error?.message ?? "WhatsApp API error";
    return { success: false, maskedPhone: maskedPhone(phone), error: msg };
  }

  return { success: true, maskedPhone: maskedPhone(phone) };
}

// Template approuvé — corps attendu : "Bonjour {{1}}, votre code LIVRA est {{2}}."
function buildTemplatePayload(
  to: string,
  templateName: string,
  clientName: string,
  otp: string
) {
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

// Mode développement / sandbox uniquement (numéros de test Meta)
function buildTextPayload(to: string, clientName: string, otp: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: `Bonjour ${clientName} !\n\nVotre code de confirmation LIVRA est :\n\n*${otp}*\n\nCe code expire dans 10 minutes. Ne le communiquez à personne.`,
    },
  };
}
