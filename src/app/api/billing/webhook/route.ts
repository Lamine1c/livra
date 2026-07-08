import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { getChargilySecret } from "@/lib/chargily";

// POST /api/billing/webhook — webhook Chargily Pay v2.
// Doc (https://dev.chargily.com/pay-v2/webhooks) : header `signature` =
// HMAC-SHA256 hex du corps BRUT signé avec la clé secrète API.
// Événements : checkout.paid / checkout.failed / checkout.canceled.
// checkout.paid → +30 jours d'abonnement, IDEMPOTENT via billing_events
// (PK = id du checkout : déjà traité → 200 sans re-créditer).

const eventSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    metadata: z.unknown().optional(),
  }),
});

// Chargily documente metadata comme paires clé/valeur libres — selon les
// intégrations elle revient en objet ou en tableau d'objets. On gère les deux.
function extractMetadata(metadata: unknown): { vendor_id?: string; email?: string } {
  const candidates = Array.isArray(metadata) ? metadata : [metadata];
  const out: { vendor_id?: string; email?: string } = {};
  for (const item of candidates) {
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      if (typeof rec.vendor_id === "string") out.vendor_id = rec.vendor_id;
      if (typeof rec.email === "string") out.email = rec.email;
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  const secret = getChargilySecret();
  if (!secret) {
    return NextResponse.json({ error: "Paiement non configuré" }, { status: 503 });
  }

  // ⚠️ Next.js : lire le corps BRUT avant tout JSON.parse — la signature
  // est calculée sur les octets exacts envoyés par Chargily.
  const rawBody = await req.text();
  const signature = req.headers.get("signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 403 });
  }

  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const computedBuf = Buffer.from(computed, "utf8");
  const receivedBuf = Buffer.from(signature, "utf8");
  if (
    computedBuf.length !== receivedBuf.length ||
    !crypto.timingSafeEqual(computedBuf, receivedBuf)
  ) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
  }

  let event: z.infer<typeof eventSchema>;
  try {
    event = eventSchema.parse(JSON.parse(rawBody));
  } catch (err) {
    console.error("[billing/webhook] payload invalide:", err);
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  // Événements ignorés (failed, canceled, etc.) → 200 immédiat, Chargily
  // attend juste un ack rapide.
  if (event.type !== "checkout.paid") {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  const meta = extractMetadata(event.data.metadata);

  // Retrouve le vendeur : vendor_id du metadata en priorité, sinon email.
  let vendorQuery = supabase
    .from("vendors_waitlist")
    .select("id, paid_until")
    .limit(1);
  if (meta.vendor_id) {
    vendorQuery = vendorQuery.eq("id", meta.vendor_id);
  } else if (meta.email) {
    vendorQuery = vendorQuery.eq("email", meta.email);
  } else {
    console.error("[billing/webhook] checkout.paid sans vendor_id/email:", event.data.id);
    return NextResponse.json({ received: true });
  }

  const { data: vendor, error: vendorError } = await vendorQuery.maybeSingle();
  if (vendorError) {
    console.error("[billing/webhook] vendor lookup failed:", vendorError);
    // 500 → Chargily retentera le webhook.
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!vendor) {
    console.error("[billing/webhook] vendeur introuvable pour checkout:", event.data.id);
    return NextResponse.json({ received: true });
  }

  // IDEMPOTENCE : insert du checkout_id (PK). Conflit 23505 = déjà traité → 200.
  const { error: insertError } = await supabase.from("billing_events").insert({
    checkout_id: event.data.id,
    event_type: event.type,
    vendor_id: vendor.id,
  });
  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, already_processed: true });
    }
    console.error("[billing/webhook] billing_events insert failed:", insertError);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  // Crédit : paid_until = GREATEST(now(), COALESCE(paid_until, now())) + 30 jours.
  const now = Date.now();
  const current = vendor.paid_until ? new Date(vendor.paid_until).getTime() : now;
  const base = Math.max(now, current);
  const newPaidUntil = new Date(base + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("vendors_waitlist")
    .update({ subscription_status: "active", paid_until: newPaidUntil })
    .eq("id", vendor.id);
  if (updateError) {
    console.error("[billing/webhook] crédit abonnement failed:", updateError);
    // Rollback de l'idempotence pour que le retry Chargily puisse re-créditer.
    const { error: rollbackError } = await supabase
      .from("billing_events")
      .delete()
      .eq("checkout_id", event.data.id);
    if (rollbackError) {
      console.error("[billing/webhook] rollback billing_events failed:", rollbackError);
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
