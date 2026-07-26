import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";

// Motifs valides pour un REFUS (écran Course, avant start-delivery). Contrat avec
// le mobile (course.refuseReasons). On ne fait jamais confiance au client : tout
// slug hors liste est coercé en 'other' (l'action reste enregistrée).
const REFUSE_REASONS = new Set(["too_far", "already_taken", "shop_unreachable", "other"]);

export async function POST(req: NextRequest) {
  let body: { deviceToken?: unknown; orderId?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deviceToken, orderId } = body;
  if (typeof deviceToken !== "string" || !deviceToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const verified = verifyDriverToken(deviceToken);
  if (!verified.valid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const reason = typeof body.reason === "string" && REFUSE_REASONS.has(body.reason)
    ? body.reason
    : "other";

  const supabase = createServiceClient();

  // Wilaya dénormalisée : dérivée server-side de la commande (source de vérité),
  // jamais du client. Confirme aussi que la commande existe.
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, client:clients(wilaya)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const client = order.client
    ? (Array.isArray(order.client) ? order.client[0] : order.client)
    : null;

  // Journalise le refus (append-only, delivery_id NULL = avant course).
  const { error: insErr } = await supabase.from("delivery_refusals").insert({
    order_id: orderId,
    delivery_id: null,
    driver_id: verified.driverId,
    kind: "refus",
    reason,
    wilaya: client?.wilaya ?? null,
  });
  if (insErr) {
    console.error("[refuse-order] insert failed:", insErr.message);
    // Non bloquant côté livreur : on ne casse pas le refus si le log échoue.
  }

  // Remet la commande à disposition (le scan l'avait passée à 'processing').
  // Guard sur 'processing' : ne pas régresser une commande déjà prise en charge.
  await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId)
    .eq("status", "processing");

  return NextResponse.json({ ok: true });
}
