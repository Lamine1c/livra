import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken, generateBuyerToken } from "@/lib/qr-token";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import { TEMPLATES, renderTemplateText } from "@/lib/whatsapp-templates";
import { sendExpoPush } from "@/lib/expo-push";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const verified = verifyDriverToken(token);
  if (!verified.valid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: { orderId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId } = body;
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Idempotence: if picked_up_at is already set, the delivery was already started + WA sent
  const { data: orderCheck } = await supabase
    .from("orders")
    .select("picked_up_at")
    .eq("id", orderId)
    .single();

  if (orderCheck?.picked_up_at) {
    const { data: existingDelivery } = await supabase
      .from("deliveries")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();
    return NextResponse.json({ deliveryId: existingDelivery?.id, alreadyStarted: true });
  }

  // Check for existing delivery row (conflict or crash recovery)
  const { data: existing } = await supabase
    .from("deliveries")
    .select("id, driver_id")
    .eq("order_id", orderId)
    .maybeSingle();

  let deliveryId: string;

  if (existing?.id) {
    if (existing.driver_id !== verified.driverId) {
      return NextResponse.json(
        { error: "Cette commande est déjà prise par un autre motard" },
        { status: 409 }
      );
    }
    await supabase
      .from("deliveries")
      .update({ status: "active" })
      .eq("id", existing.id);
    deliveryId = existing.id;
  } else {
    const { data: delivery, error } = await supabase
      .from("deliveries")
      .insert({ order_id: orderId, driver_id: verified.driverId })
      .select("id")
      .single();

    if (error || !delivery) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
    }
    deliveryId = delivery.id;
  }

  // Fetch driver prenom
  const { data: driver } = await supabase
    .from("drivers")
    .select("prenom")
    .eq("id", verified.driverId)
    .single();
  const driverPrenom = driver?.prenom ?? "votre livreur";

  // Fetch order + client + vendor info
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, client:clients(phone, full_name)")
    .eq("id", orderId)
    .single();

  if (!order) {
    console.error("[start-delivery] order not found:", orderId);
  } else {
    const client = order.client
      ? (Array.isArray(order.client) ? order.client[0] : order.client)
      : null;

    const { data: vendor } = await supabase
      .from("profiles")
      .select("store_name, full_name")
      .eq("id", order.user_id)
      .single();
    const vendorName = vendor?.store_name ?? vendor?.full_name ?? "votre boutique";

    if (client?.phone) {
      const buyerToken = generateBuyerToken(orderId);
      const trackingUrl = `https://golivra.app/track?t=${buyerToken}`;
      const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
      const message = renderTemplateText(TEMPLATES.delivery_perso_enroute, [prenom, vendorName, trackingUrl]);
      const waResult = await sendWhatsAppNotification(client.phone, message);
      if (!waResult.success) {
        console.error("[start-delivery] WhatsApp send failed:", waResult.error);
      }
    } else {
      console.error("[start-delivery] client phone missing, WA skipped");
    }
  }

  // Update order: driver has started — "shipped" = Prise en charge
  await supabase
    .from("orders")
    .update({
      picked_up_at: new Date().toISOString(),
      status: "shipped",
      driver_id: verified.driverId,
    })
    .eq("id", orderId);

  // Push notif to vendor — delivery started (idempotence already ensured by picked_up_at check above)
  if (order?.user_id) {
    const { data: vendorPush } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", order.user_id)
      .single();

    if (vendorPush?.expo_push_token) {
      const pushResult = await sendExpoPush(
        vendorPush.expo_push_token,
        "🛵 Livreur en route",
        `${driverPrenom} a démarré la livraison de la commande #${orderId.slice(0, 8).toUpperCase()}.`,
        { orderId, type: "delivery_started" }
      );
      if (!pushResult.success) {
        console.error("[start-delivery] expo push failed:", pushResult.error);
      }
    }
  }

  return NextResponse.json({ deliveryId });
}
