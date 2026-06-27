import { NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/meta";
import { handleInboundReply } from "@/lib/confirm-order";

// Webhook WhatsApp ENTRANT (réponses des clients).
// Format = WhatsApp Cloud API (entry[].changes[].value.messages[]) — identique
// pour 360dialog ET Meta direct. 360dialog n'est pas encore live (~28 juin) :
// la route est prouvée par curl maintenant, E2E réel le jour de l'activation.

// ─── GET : handshake de vérification du webhook ───────────────
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token === verifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─── Authenticité (selon le provider) ─────────────────────────
// Meta direct : signature HMAC X-Hub-Signature-256 (META_APP_SECRET).
// 360dialog : mécanisme exact à confirmer au signup (~28 juin) → hook propre
//   ci-dessous (secret partagé via header/query). Tant qu'il n'est pas configuré,
//   le chemin 360dialog reste fermé (403) et seul le chemin Meta signé passe.
function isAuthentic(req: NextRequest, rawBody: Buffer): boolean {
  // TEMP TWILIO SANDBOX — retirer à l'activation 360dialog.
  // Bypass d'auth UNIQUEMENT si TWILIO_SANDBOX_MODE=1 + content-type form-urlencoded.
  // En prod 360dialog cette var sera absente → ce chemin est fermé.
  if (process.env.TWILIO_SANDBOX_MODE === "1") {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded")) return true;
  }

  const metaSig = req.headers.get("x-hub-signature-256");
  if (metaSig) {
    const secret = process.env.META_APP_SECRET;
    if (!secret) {
      console.error("[whatsapp/inbound] META_APP_SECRET non configuré — refus");
      return false;
    }
    return verifyWebhookSignature(rawBody, metaSig, secret);
  }

  // ── Hook 360dialog (à finaliser au branchement réel) ──
  const d360Secret = process.env.D360_WEBHOOK_SECRET;
  if (d360Secret) {
    const provided =
      req.headers.get("x-360dialog-webhook-secret") ??
      req.nextUrl.searchParams.get("secret");
    return provided === d360Secret;
  }

  console.error("[whatsapp/inbound] aucune méthode d'authentification disponible — refus");
  return false;
}

// ─── Parsing Cloud API ────────────────────────────────────────
type CloudInboundPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          type: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

function extractTextMessages(payload: CloudInboundPayload): Array<{ from: string; body: string }> {
  const out: Array<{ from: string; body: string }> = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        if (msg.type === "text" && msg.text?.body && msg.from) {
          out.push({ from: msg.from, body: msg.text.body });
        }
      }
    }
  }
  return out;
}

// ─── POST : messages entrants ─────────────────────────────────
export async function POST(req: NextRequest) {
  // Lire le body brut AVANT tout (nécessaire pour la vérification de signature).
  const rawBody = Buffer.from(await req.arrayBuffer());

  if (!isAuthentic(req, rawBody)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Détection du format : Twilio sandbox (form-urlencoded) vs Cloud API (JSON).
  let messages: Array<{ from: string; body: string }>;
  const contentType = req.headers.get("content-type") ?? "";

  // TEMP TWILIO SANDBOX — retirer à l'activation 360dialog.
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody.toString("utf8"));
    const from = params.get("From")?.replace("whatsapp:", "").trim();
    const body = params.get("Body")?.trim();
    messages = from && body ? [{ from, body }] : [];
  } else {
    let payload: CloudInboundPayload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      console.error("[whatsapp/inbound] payload JSON invalide");
      return new Response("OK", { status: 200 });
    }
    messages = extractTextMessages(payload);
  }

  // Le Realtime vendeur est déjà branché → l'écran passe à « Confirmée » seul
  // quand l'order est mis à jour. L'entrée manuelle vendeur reste le fallback.
  for (const m of messages) {
    try {
      await handleInboundReply(m.from, m.body);
    } catch (err) {
      // Pas de catch muet : on logge, et on continue les autres messages.
      console.error("[whatsapp/inbound] erreur traitement message:", err);
    }
  }

  // Toujours 200 : les providers re-tentent agressivement sur tout autre statut.
  return new Response("OK", { status: 200 });
}
