import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/rate-limit";
import { resolveApiKey } from "@/lib/inbound/auth";
import { parseInboundOrder } from "@/lib/inbound/schema";
import { createInboundOrder, logInboundEvent } from "@/lib/inbound/create-order";

// LOT 13 · Porte n°1 — POST /api/inbound/orders. Une commande entrante par requête,
// authentifiée par clé API (035_inbound_sources), idempotente, journalisée sans PII.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

  // 1. Rate limit par IP (abus évidents).
  if (!rateLimit(`inbound:ip:${ip}`, 120, 60_000)) {
    await logInboundEvent(supabase, { sourceId: null, userId: null, status: "rejected", rejectReason: "rate_limited" });
    return NextResponse.json({ error: "rate_limited", retry_after: 30 }, { status: 429 });
  }

  // 2. Clé API → source + vendeur.
  const auth = await resolveApiKey(req.headers.get("authorization"));
  if (!auth) {
    await logInboundEvent(supabase, { sourceId: null, userId: null, status: "rejected", rejectReason: "bad_key" });
    return NextResponse.json({ error: "invalid_key" }, { status: 401 });
  }

  // 3. Rate limit par clé (par source authentifiée).
  if (!rateLimit(`inbound:key:${auth.sourceId}`, 60, 60_000)) {
    await logInboundEvent(supabase, { sourceId: auth.sourceId, userId: auth.userId, status: "rejected", rejectReason: "rate_limited" });
    return NextResponse.json({ error: "rate_limited", retry_after: 30 }, { status: 429 });
  }

  // 4. JSON + schéma.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    await logInboundEvent(supabase, { sourceId: auth.sourceId, userId: auth.userId, status: "rejected", rejectReason: "validation" });
    return NextResponse.json({ error: "validation", fields: ["(invalid json)"] }, { status: 422 });
  }
  const parsed = parseInboundOrder(raw);
  if (!parsed.ok) {
    await logInboundEvent(supabase, { sourceId: auth.sourceId, userId: auth.userId, status: "rejected", rejectReason: "validation" });
    return NextResponse.json({ error: "validation", fields: parsed.fields }, { status: 422 });
  }

  // 5. Création (idempotente).
  try {
    const result = await createInboundOrder(parsed.data, { userId: auth.userId, supabase });
    if (result.duplicate) {
      await logInboundEvent(supabase, {
        sourceId: auth.sourceId, userId: auth.userId, status: "rejected", rejectReason: "duplicate",
        orderId: result.orderId, externalRef: parsed.data.external_order_id,
      });
      return NextResponse.json({ status: "duplicate", order_id: result.orderId, reference: result.reference }, { status: 200 });
    }
    await logInboundEvent(supabase, {
      sourceId: auth.sourceId, userId: auth.userId, status: "order_created",
      orderId: result.orderId, externalRef: parsed.data.external_order_id,
    });
    return NextResponse.json({ status: "created", order_id: result.orderId, reference: result.reference }, { status: 201 });
  } catch (err) {
    // 6. Erreur inattendue.
    console.error("[inbound/orders]", err);
    await logInboundEvent(supabase, {
      sourceId: auth.sourceId, userId: auth.userId, status: "error",
      errorMessage: String(err), externalRef: parsed.data.external_order_id,
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
