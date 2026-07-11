import { NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/meta";
import { handleInboundReply } from "@/lib/confirm-order";

// Webhook WhatsApp ENTRANT (réponses des clients) — WhatsApp Cloud API, Meta direct.
// Transport 100 % Meta : l'authenticité repose sur la signature HMAC
// X-Hub-Signature-256 (SHA256 du corps BRUT avec META_APP_SECRET).
// Retiré : bypass Twilio sandbox (dette signalée à l'audit du 8 juil) + piste
// 360dialog spéculative (Meta direct est le provider retenu).

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

// ─── Authenticité : signature Meta obligatoire ────────────────
// Logs granulaires pour diagnostiquer un 403 : header absent vs secret absent
// vs signature qui ne correspond pas (META_APP_SECRET ≠ app émettrice).
function isAuthentic(req: NextRequest, rawBody: Buffer): boolean {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    console.error("[whatsapp/inbound] refus : header X-Hub-Signature-256 absent");
    return false;
  }
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.error("[whatsapp/inbound] refus : META_APP_SECRET non configuré");
    return false;
  }
  const ok = verifyWebhookSignature(rawBody, signature, secret);
  if (!ok) {
    console.error(
      "[whatsapp/inbound] refus : signature invalide " +
        "(META_APP_SECRET ne correspond pas à l'app qui possède le webhook ?)"
    );
  }
  return ok;
}

// ─── Parsing Cloud API — texte + réponses interactives ────────
type CloudMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
  button?: { payload?: string; text?: string };
};

type CloudInboundPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: { messages?: CloudMessage[] };
    }>;
  }>;
};

// Corps exploitable d'un message entrant :
//   - text        → text.body
//   - interactive → titre du bouton/liste choisi (button_reply / list_reply)
//   - button      → texte/payload d'un bouton quick-reply de template
// handleInboundReply matche ensuite ce corps (OUI / NON / objection / code) :
// la logique métier reste inchangée, on n'adapte que le TRANSPORT.
function messageBody(m: CloudMessage): string | null {
  if (m.type === "text") return m.text?.body ?? null;
  if (m.type === "interactive") {
    const it = m.interactive;
    if (it?.type === "button_reply") return it.button_reply?.title ?? it.button_reply?.id ?? null;
    if (it?.type === "list_reply") return it.list_reply?.title ?? it.list_reply?.id ?? null;
    return null;
  }
  if (m.type === "button") return m.button?.text ?? m.button?.payload ?? null;
  return null;
}

function extractMessages(payload: CloudInboundPayload): Array<{ from: string; body: string }> {
  const out: Array<{ from: string; body: string }> = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        const body = messageBody(m);
        if (m.from && body) out.push({ from: m.from, body });
      }
    }
  }
  return out;
}

// ─── POST : messages entrants ─────────────────────────────────
export async function POST(req: NextRequest) {
  // Corps BRUT lu AVANT tout parsing (nécessaire à la vérification de signature).
  const rawBody = Buffer.from(await req.arrayBuffer());

  if (!isAuthentic(req, rawBody)) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: CloudInboundPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    console.error("[whatsapp/inbound] payload JSON invalide");
    return new Response("OK", { status: 200 });
  }

  // Le Realtime vendeur est déjà branché → l'écran passe à « Confirmée » seul
  // quand l'order est mis à jour. L'entrée manuelle vendeur reste le fallback.
  for (const m of extractMessages(payload)) {
    try {
      await handleInboundReply(m.from, m.body);
    } catch (err) {
      // Pas de catch muet : on logge, et on continue les autres messages.
      console.error("[whatsapp/inbound] erreur traitement message:", err);
    }
  }

  // Toujours 200 : Meta re-tente agressivement sur tout autre statut.
  return new Response("OK", { status: 200 });
}
