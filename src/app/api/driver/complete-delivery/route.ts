import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";
import { sendWhatsAppTemplate, maskPhoneForLog } from "@/lib/whatsapp";
import { TEMPLATES } from "@/lib/whatsapp-templates";
import { sendExpoPush } from "@/lib/expo-push";
import { orderDelivered } from "@/lib/push-messages";

export async function POST(req: NextRequest) {
  let body: { deviceToken?: unknown; deliveryId?: unknown; orderId?: unknown };
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

  // Une course annulée ne peut pas être « complétée » : sinon on écraserait
  // l'annulation (deliveries=completed + orders=delivered). Garde symétrique à
  // position et start-delivery (fix « course fantôme », 27 juil).
  if (delivery.status === "cancelled") {
    return NextResponse.json(
      { error: "Delivery cancelled", code: "DELIVERY_CANCELLED" },
      { status: 409 }
    );
  }

  // Idempotent: deliveries already completed — repair orders.status if a previous attempt failed
  // between UPDATE deliveries and UPDATE orders
  if (delivery.status === "completed") {
    const { data: orderCheck } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (orderCheck && orderCheck.status !== "delivered") {
      console.log("[complete-delivery] repairing broken state: deliveries=completed but orders.status=" + orderCheck.status, orderId);
      const { error: repairErr } = await supabase
        .from("orders")
        .update({ status: "delivered", delivered_at: new Date().toISOString() })
        .eq("id", orderId);
      if (repairErr) {
        console.error("[complete-delivery] repair orders update failed:", repairErr.message, repairErr.code);
        return NextResponse.json({ error: "Repair failed" }, { status: 500 });
      }
      console.log("[complete-delivery] repair OK, orders.status now delivered", orderId);
    }
    return NextResponse.json({ ok: true, completedAt: null });
  }

  const completedAt = new Date().toISOString();

  const { error: delErr } = await supabase
    .from("deliveries")
    .update({ status: "completed", completed_at: completedAt })
    .eq("id", deliveryId);

  if (delErr) {
    console.error("[complete-delivery] deliveries update failed:", delErr.message, delErr.code);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }

  console.log("[complete-delivery] about to UPDATE orders.status=delivered", { orderId, deliveryId });
  const { error: ordErr } = await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: completedAt })
    .eq("id", orderId);

  if (ordErr) {
    console.error("[complete-delivery] orders update failed:", ordErr.message, ordErr.code, ordErr.details);
    return NextResponse.json(
      { error: "Delivery marked but order status failed to update" },
      { status: 500 }
    );
  }

  // Fetch order + client + vendor for WA notification
  const { data: order } = await supabase
    .from("orders")
    .select("user_id, client:clients(phone, full_name)")
    .eq("id", orderId)
    .single();

  if (!order) {
    console.error("[complete-delivery] order not found for WA:", orderId);
  } else {
    const client = order.client
      ? (Array.isArray(order.client) ? order.client[0] : order.client)
      : null;

    const { data: vendor } = await supabase
      .from("profiles")
      .select("store_name, full_name, expo_push_token, locale")
      .eq("id", order.user_id)
      .single();
    const vendorName = vendor?.store_name ?? vendor?.full_name ?? "votre boutique";

    if (client?.phone) {
      const waResult = await sendWhatsAppTemplate(client.phone, TEMPLATES.delivery_completed, [vendorName]);
      if (!waResult.success) {
        console.error("[complete-delivery] WhatsApp send failed:", waResult.error);
      } else {
        console.log(
          `[complete-delivery] WhatsApp delivery_completed sent OK → wamid=${waResult.wamid ?? "?"} phone=${maskPhoneForLog(client.phone)}`
        );
      }
    } else {
      console.error("[complete-delivery] client phone missing, WA skipped");
    }

    // Push notif to vendor — delivery completed
    if (vendor?.expo_push_token) {
      const { title, body } = orderDelivered(vendor.locale, {
        reference: orderId.slice(0, 8).toUpperCase(),
      });
      const pushResult = await sendExpoPush(
        vendor.expo_push_token,
        title,
        body,
        { orderId, type: "delivery_completed" }
      );
      if (!pushResult.success) {
        console.error("[complete-delivery] expo push failed:", pushResult.error);
      }
    }
  }

  return NextResponse.json({ ok: true, completedAt });
}
