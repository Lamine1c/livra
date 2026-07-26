import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";
import { sendExpoPush } from "@/lib/expo-push";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { driverCancelledDelivery, refusalReasonLabel } from "@/lib/push-messages";

// Motifs valides pour une ANNULATION (livraison en cours). Contrat avec le mobile
// (delivery.cancelReasons). Slug hors liste → 'other' (l'action reste enregistrée).
const CANCEL_REASONS = new Set([
  "accident_panne", "no_answer", "client_refused", "other",
]);

export async function POST(req: NextRequest) {
  let body: { deviceToken?: unknown; deliveryId?: unknown; orderId?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deviceToken, deliveryId, orderId } = body;

  if (typeof deviceToken !== "string" || !deviceToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  if (
    typeof deliveryId !== "string" || !deliveryId ||
    typeof orderId !== "string" || !orderId
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = verifyDriverToken(deviceToken);
  if (!result.valid) {
    const status = result.expired ? 401 : 403;
    return NextResponse.json(
      { error: result.expired ? "Token expired" : "Invalid token" },
      { status }
    );
  }
  const { driverId } = result;

  const supabase = createServiceClient();

  const { data: delivery, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, status, order_id, driver_id")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError || !delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }
  if (delivery.driver_id !== driverId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (delivery.order_id !== orderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  // Idempotent: already cancelled
  if (delivery.status === "cancelled") {
    return NextResponse.json({ ok: true });
  }
  // Cannot cancel a completed delivery
  if (delivery.status === "completed") {
    return NextResponse.json({ error: "Delivery already completed" }, { status: 409 });
  }

  const now = new Date().toISOString();

  const { error: delErr } = await supabase
    .from("deliveries")
    .update({ status: "cancelled", completed_at: now })
    .eq("id", deliveryId);

  if (delErr) {
    console.error("[cancel-delivery] deliveries update failed:", delErr.message);
    return NextResponse.json({ error: "Failed to cancel delivery" }, { status: 500 });
  }

  const reason = typeof body.reason === "string" && CANCEL_REASONS.has(body.reason)
    ? body.reason
    : "other";
  // Décision Lamine (gate tour 3) : dans TOUS les cas d'annulation, le livreur a le
  // colis en main et le ramène à la boutique → la commande est 'returned', jamais
  // 'confirmed'. (Le choix vendeur « relancer/attendre » pour accident/panne est un
  // backlog, pas maintenant.) Le motif sert au log + notif, pas au statut.
  const { error: ordErr } = await supabase
    .from("orders")
    .update({ status: "returned" })
    .eq("id", orderId);

  if (ordErr) {
    console.error("[cancel-delivery] orders update failed after cancellation:", ordErr.message);
    return NextResponse.json(
      { error: "Delivery cancelled but order status failed to update" },
      { status: 500 }
    );
  }

  // Commande (référence + vendeur + wilaya dénorm + contact acheteur) et prénom livreur.
  const { data: order } = await supabase
    .from("orders")
    .select("reference, user_id, client:clients(wilaya, phone, full_name)")
    .eq("id", orderId)
    .single();
  const client = order?.client
    ? (Array.isArray(order.client) ? order.client[0] : order.client)
    : null;

  const { error: refErr } = await supabase.from("delivery_refusals").insert({
    order_id: orderId,
    delivery_id: deliveryId,
    driver_id: driverId,
    kind: "annulation",
    reason,
    wilaya: client?.wilaya ?? null,
  });
  if (refErr) {
    console.error("[cancel-delivery] refusal log failed:", refErr.message);
  }

  // Push vendeur : la commande était en route, elle ne l'est plus → il DOIT le savoir.
  if (order?.user_id) {
    const [{ data: driver }, { data: vendorPush }] = await Promise.all([
      supabase.from("drivers").select("prenom").eq("id", driverId).single(),
      supabase.from("profiles").select("expo_push_token, locale").eq("id", order.user_id).single(),
    ]);
    if (vendorPush?.expo_push_token) {
      const reference = order.reference ?? orderId.slice(0, 8).toUpperCase();
      const { title, body: pushBody } = driverCancelledDelivery(vendorPush.locale, {
        driverName: driver?.prenom ?? "Le livreur",
        reference,
        reasonLabel: refusalReasonLabel(vendorPush.locale, reason),
      });
      const pushResult = await sendExpoPush(
        vendorPush.expo_push_token, title, pushBody,
        { orderId, type: "delivery_cancelled_by_driver" }
      );
      if (!pushResult.success) {
        console.error("[cancel-delivery] expo push failed:", pushResult.error);
      }
    }
  }

  // WhatsApp acheteur : sa commande était en route, elle est annulée → il DOIT le
  // savoir. Best-effort (fenêtre 24h Meta ; échec silencieux si fermée). Bilingue
  // FR/AR — la locale acheteur n'est pas stockée.
  if (client?.phone) {
    const reference = order?.reference ?? orderId.slice(0, 8).toUpperCase();
    const msg =
      `Bonjour, votre commande ${reference} a été annulée. La boutique vous recontactera.\n` +
      `تم إلغاء طلبك ${reference}. سيتواصل معك المتجر قريباً.`;
    const waRes = await sendWhatsAppNotification(client.phone, msg);
    if (!waRes.success) {
      console.error("[cancel-delivery] buyer WhatsApp failed:", waRes.error);
    }
  }

  return NextResponse.json({ ok: true });
}
