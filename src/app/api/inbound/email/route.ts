import crypto from "crypto";
import { NextRequest, NextResponse, after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/rate-limit";
import { sendExpoPush } from "@/lib/expo-push";
import { normalizePushLocale } from "@/lib/push-messages";
import { parseOrderEmail } from "@/lib/inbound/email-parser";
import { createInboundOrder, logInboundEvent } from "@/lib/inbound/create-order";

// LOT 13 · Porte n°0 — POST /api/inbound/email. Webhook Resend `email.received`.
//
// Le corps de l'email n'arrive PAS dans le webhook (métadonnées seulement). On le récupère
// via l'API Resend, on le passe au parser LLM, on crée la commande via la porte 1 — puis on
// JETTE le corps. Jamais de PII (corps/téléphone/clé) en base ni en log.
//
// FLOW (annexe COMMANDE, 10 étapes) : signature svix → dédup svix-id → type → slug → pairing →
// bad_sender → rate-limit → doublon (court-circuit AVANT le LLM via sha256(message_id)) →
// GET corps + LLM → createInboundOrder. TOUJOURS 200 après l'étape signature (Resend ne
// re-livre que sans 200 ; on absorbe donc toute erreur post-signature en 200 + event journalisé).
export const runtime = "nodejs";

const RESEND_RETRIEVE_URL = "https://api.resend.com/emails";
const SIGNATURE_TOLERANCE_S = 5 * 60;

// ─── Vérification manuelle de la signature svix (pas de dépendance svix) ──────
// Schéma svix : secret = `whsec_<base64>` ; signedContent = `${id}.${timestamp}.${body}` ;
// signature = base64(HMAC-SHA256(base64decode(secret), signedContent)). Le header
// `svix-signature` est une liste espace-séparée de `v1,<sig>`. Comparaison timing-safe.
function verifySvixSignature(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  // Tolérance temporelle (anti-replay).
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > SIGNATURE_TOLERANCE_S) return false;

  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = Buffer.from(secretKey, "base64");

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", keyBytes).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected);

  // Le header peut contenir plusieurs signatures (rotation de clé) : « v1,sigA v1,sigB ».
  for (const part of signature.split(" ")) {
    const comma = part.indexOf(",");
    const provided = comma >= 0 ? part.slice(comma + 1) : part;
    const providedBuf = Buffer.from(provided);
    if (providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}

// Extrait l'adresse email brute d'un champ « Nom <addr@dom> » ou « addr@dom ».
function extractAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/<([^>]+)>/);
  const addr = (m ? m[1] : raw).trim().toLowerCase();
  return addr.includes("@") ? addr : null;
}

function domainOf(addr: string | null): string | null {
  if (!addr) return null;
  const at = addr.lastIndexOf("@");
  return at >= 0 ? addr.slice(at + 1) : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function ok200(body: Record<string, unknown> = { ok: true }) {
  return NextResponse.json(body, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  // ── Étape 1 : signature svix. Corps LU EN BRUT (le HMAC porte sur le body exact). ──
  const rawBody = await req.text();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[inbound/email] RESEND_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }
  if (!verifySvixSignature(rawBody, req.headers, webhookSecret)) {
    // Pas d'écriture DB avant authentification (anti-flood non authentifié).
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  // ── INVARIANT : à partir d'ici, TOUJOURS 200. Toute erreur inattendue (DB transitoire,
  //    etc.) est absorbée en 200 pour ne pas déclencher les re-livraisons Resend. ──
  try {
    return await handleEmailReceived(rawBody, req.headers, supabase);
  } catch (err) {
    console.error("[inbound/email] erreur inattendue:", err instanceof Error ? err.message : "?");
    return ok200({ ok: true, error: "internal" });
  }
}

async function handleEmailReceived(
  rawBody: string,
  headers: Headers,
  supabase: SupabaseClient
): Promise<NextResponse> {
  const svixId = headers.get("svix-id");

  let payload: {
    type?: string;
    data?: {
      email_id?: string;
      from?: string;
      to?: string[];
      message_id?: string;
      subject?: string;
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return ok200({ ok: true, ignored: "invalid_json" });
  }

  // ── Étape 3 : type d'événement (avant la dédup pour ne pas marquer du bruit). ──
  if (payload.type !== "email.received") {
    return ok200({ ok: true, ignored: payload.type ?? "unknown_type" });
  }

  // ── Étape 2 : dédup svix-id (kind='email_webhook', external_ref=svix-id). ──
  if (svixId) {
    const { data: seen } = await supabase
      .from("inbound_events")
      .select("id")
      .eq("kind", "email_webhook")
      .eq("external_ref", svixId)
      .maybeSingle();
    if (seen) return ok200({ ok: true, deduplicated: true });
    // Marqueur de réception (best-effort ; l'idempotence ordre est le vrai filet).
    await logInboundEvent(supabase, {
      sourceId: null,
      userId: null,
      status: "received",
      kind: "email_webhook",
      externalRef: svixId,
    });
  }

  const data = payload.data ?? {};
  const emailId = data.email_id ?? "";
  const messageId = data.message_id ?? "";
  const subject = data.subject ?? "";
  const senderDomain = domainOf(extractAddress(data.from));

  // ── Étape 4 : slug → inbound_sources actif kind='email'. ──
  // On tente le local-part ET l'adresse complète (selon la convention de seed).
  const slugCandidates = new Set<string>();
  for (const to of data.to ?? []) {
    const addr = extractAddress(to);
    if (!addr) continue;
    slugCandidates.add(addr);
    slugCandidates.add(addr.slice(0, addr.lastIndexOf("@")));
  }
  if (slugCandidates.size === 0) {
    await logInboundEvent(supabase, {
      sourceId: null, userId: null, status: "rejected", kind: "email",
      rejectReason: "unknown_slug", externalRef: messageId || null,
    });
    return ok200({ ok: true, rejected: "unknown_slug" });
  }

  const { data: sources } = await supabase
    .from("inbound_sources")
    .select("id, user_id, expected_sender_domain, email_slug")
    .eq("kind", "email")
    .eq("active", true)
    .is("revoked_at", null)
    .in("email_slug", Array.from(slugCandidates));
  const source = sources?.[0];
  if (!source) {
    await logInboundEvent(supabase, {
      sourceId: null, userId: null, status: "rejected", kind: "email",
      rejectReason: "unknown_slug", externalRef: messageId || null,
    });
    return ok200({ ok: true, rejected: "unknown_slug" });
  }
  const sourceId = source.id as string;
  const userId = source.user_id as string;

  // ── Étape 5 : pairing. expected_sender_domain NULL → aucune commande, push vendeur. ──
  const expectedDomain = (source.expected_sender_domain as string | null) ?? null;
  if (!expectedDomain) {
    await logInboundEvent(supabase, {
      sourceId, userId, status: "received", kind: "email",
      rejectReason: null, externalRef: messageId || null,
    });
    // Push « boutique détectée » (best-effort, hors chemin de réponse).
    if (senderDomain) {
      after(async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("expo_push_token, locale")
          .eq("id", userId)
          .single();
        const token = profile?.expo_push_token as string | undefined;
        if (!token) return;
        const l = normalizePushLocale(profile?.locale as string | null | undefined);
        const title = l === "ar" ? "📧 تم اكتشاف متجر" : "📧 Boutique détectée";
        const body =
          l === "ar"
            ? `${senderDomain} — أكّد المصدر في الإعدادات`
            : `Boutique détectée : ${senderDomain} — confirme dans Réglages`;
        const r = await sendExpoPush(token, title, body, { type: "inbound_pairing" });
        if (!r.success) console.error("[inbound/email] pairing push:", r.error);
      });
    }
    return ok200({ ok: true, pairing: true });
  }

  // ── Étape 6 : domaine expéditeur ≠ attendu → bad_sender. ──
  if (!senderDomain || senderDomain !== expectedDomain.toLowerCase()) {
    await logInboundEvent(supabase, {
      sourceId, userId, status: "rejected", kind: "email",
      rejectReason: "bad_sender", externalRef: messageId || null,
    });
    return ok200({ ok: true, rejected: "bad_sender" });
  }

  // ── Étape 7 : rate-limit 30 / 10 min par source. ──
  if (!rateLimit(`inbound:email:${sourceId}`, 30, 10 * 60_000)) {
    await logInboundEvent(supabase, {
      sourceId, userId, status: "rejected", kind: "email",
      rejectReason: "rate_limited", externalRef: messageId || null,
    });
    return ok200({ ok: true, rejected: "rate_limited" });
  }

  // ── Étape 8 : doublon AVANT le LLM. external_order_id de repli = sha256(message_id ou
  //    email_id) — connu sans le corps → court-circuit d'une re-livraison sans appel LLM ni
  //    fetch PII. (Le cas « n° extrait par le LLM » est dédupliqué par createInboundOrder.) ──
  const idBasis = messageId || emailId;
  const fallbackExternalId = crypto.createHash("sha256").update(idBasis).digest("hex");
  if (idBasis) {
    const { data: dup } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .eq("source", "email")
      .eq("external_order_id", fallbackExternalId)
      .maybeSingle();
    if (dup) {
      await logInboundEvent(supabase, {
        sourceId, userId, status: "rejected", kind: "email",
        rejectReason: "duplicate", orderId: dup.id as string, externalRef: fallbackExternalId,
      });
      return ok200({ ok: true, status: "duplicate", order_id: dup.id as string });
    }
  }

  // ── Étape 9 : récupération du corps (test local sans MX via INBOUND_EMAIL_TEST_BODY). ──
  let bodyText: string | null = null;
  if (process.env.NODE_ENV !== "production" && process.env.INBOUND_EMAIL_TEST_BODY) {
    bodyText = process.env.INBOUND_EMAIL_TEST_BODY;
  } else if (emailId && process.env.RESEND_API_KEY) {
    try {
      const res = await fetch(`${RESEND_RETRIEVE_URL}/${encodeURIComponent(emailId)}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (res.ok) {
        const email = (await res.json()) as { text?: string; html?: string };
        const t = email.text?.trim();
        bodyText = t ? t : email.html ? stripHtml(email.html) : null;
      } else {
        console.error(`[inbound/email] Resend retrieve HTTP ${res.status}`);
      }
    } catch (e) {
      console.error("[inbound/email] Resend retrieve failed:", e instanceof Error ? e.message : "?");
    }
  }
  if (!bodyText) {
    await logInboundEvent(supabase, {
      sourceId, userId, status: "error", kind: "email",
      errorMessage: "body_unavailable", externalRef: messageId || null,
    });
    return ok200({ ok: true, error: "body_unavailable" });
  }

  // ── Étape 9b : parsing LLM. Téléphone illisible / échec → parse_failed. ──
  const parsed = await parseOrderEmail(bodyText, subject);
  if ("error" in parsed) {
    await logInboundEvent(supabase, {
      sourceId, userId, status: "rejected", kind: "email",
      rejectReason: "parse_failed", externalRef: messageId || null,
    });
    return ok200({ ok: true, rejected: "parse_failed" });
  }

  // ── Étape 10 : création via porte 1. external_order_id extrait sinon le repli sha256. ──
  const externalOrderId = parsed.payload.external_order_id ?? fallbackExternalId;

  try {
    const result = await createInboundOrder(
      { ...parsed.payload, external_order_id: externalOrderId },
      { userId, supabase, source: "email" }
    );
    if (result.duplicate) {
      await logInboundEvent(supabase, {
        sourceId, userId, status: "rejected", kind: "email",
        rejectReason: "duplicate", orderId: result.orderId, externalRef: externalOrderId,
      });
      return ok200({ ok: true, status: "duplicate", order_id: result.orderId });
    }
    await logInboundEvent(supabase, {
      sourceId, userId, status: "order_created", kind: "email",
      orderId: result.orderId, externalRef: externalOrderId,
    });
    return ok200({ ok: true, status: "created", order_id: result.orderId });
  } catch (err) {
    // Erreur diagnostiquée côté serveur (log éphémère) ; en base on ne stocke QU'un code
    // générique — jamais String(err), qui pourrait charrier des valeurs de ligne (PII).
    console.error("[inbound/email] createInboundOrder:", err instanceof Error ? err.message : "?");
    await logInboundEvent(supabase, {
      sourceId, userId, status: "error", kind: "email",
      errorMessage: "order_creation_failed", externalRef: externalOrderId,
    });
    return ok200({ ok: true, error: "internal" });
  }
}
