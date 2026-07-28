import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken, generateBuyerToken } from "@/lib/qr-token";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { TEMPLATES } from "@/lib/whatsapp-templates";
import { sendExpoPush } from "@/lib/expo-push";
import { deliveryStarted } from "@/lib/push-messages";

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

  // Idempotence + garde de statut (fix « course fantôme », 27 juil).
  // On récupère la delivery de la commande et on branche sur son STATUT, au lieu de
  // court-circuiter sur orders.picked_up_at : ce champ reste rempli après une annulation,
  // donc il renvoyait une delivery CLOSE (cancelled/completed) comme si elle était vivante
  // (200 → « course fantôme » : le livreur roule, encaisse, marque livrée, et rien ne
  // s'écrit). Décision Lamine V1 : on REFUSE une course close, on ne réassigne pas
  // (la réassignation = feature « relancer » du backlog, qui exige un choix vendeur).
  //
  // ⚠️ Tri : il y a AU PLUS une delivery par commande aujourd'hui → limit(1) est
  // déterministe. On n'utilise PAS maybeSingle(), qui LÈVE une erreur dès qu'il y a >1
  // ligne (ce sera le cas normal quand « relancer » créera une 2e delivery). On n'ajoute
  // PAS d'ORDER BY : `deliveries` n'a pas de colonne de date exploitable en prod
  // (`created_at` absent — migration 006 ne l'ajoute pas dans l'ALTER de rattrapage ;
  // last_position_at/completed_at sont NULL sur une course active). → colonne/tri à
  // décider avec Lamine AVANT la feature « relancer » (cf. rendu).
  const { data: deliveryRows } = await supabase
    .from("deliveries")
    .select("id, driver_id, status")
    .eq("order_id", orderId)
    .limit(1);
  const existing = deliveryRows?.[0];

  if (existing) {
    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "Delivery cancelled", code: "DELIVERY_CANCELLED" },
        { status: 409 }
      );
    }
    if (existing.status === "completed") {
      return NextResponse.json(
        { error: "Delivery completed", code: "DELIVERY_COMPLETED" },
        { status: 409 }
      );
    }
    // status === "active" → récupération après crash (comportement légitime existant).
    if (existing.driver_id !== verified.driverId) {
      return NextResponse.json(
        { error: "Cette commande est déjà prise par un autre motard", code: "DELIVERY_TAKEN" },
        { status: 409 }
      );
    }
    await supabase
      .from("deliveries")
      .update({ status: "active" })
      .eq("id", existing.id);
    // On renvoie la delivery existante SANS renvoyer WhatsApp / push : l'acheteur et le
    // vendeur ont déjà été notifiés au 1er démarrage (idempotence, ex-garde picked_up_at).
    return NextResponse.json({ deliveryId: existing.id, alreadyStarted: true });
  }

  // Aucune delivery : chemin normal — création + WhatsApp acheteur + push vendeur.
  const { data: delivery, error } = await supabase
    .from("deliveries")
    .insert({ order_id: orderId, driver_id: verified.driverId })
    .select("id")
    .single();

  if (error || !delivery) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }
  const deliveryId: string = delivery.id;

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
      const waResult = await sendWhatsAppTemplate(client.phone, TEMPLATES.delivery_perso_enroute, [prenom, vendorName, trackingUrl]);
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

  // Push notif to vendor — delivery started (on n'arrive ici que sur une création réelle :
  // la récupération d'une course active a déjà return early sans renvoyer de push)
  if (order?.user_id) {
    const { data: vendorPush } = await supabase
      .from("profiles")
      .select("expo_push_token, locale")
      .eq("id", order.user_id)
      .single();

    if (vendorPush?.expo_push_token) {
      const { title, body } = deliveryStarted(vendorPush.locale, {
        driverName: driverPrenom,
        reference: orderId.slice(0, 8).toUpperCase(),
      });
      const pushResult = await sendExpoPush(
        vendorPush.expo_push_token,
        title,
        body,
        { orderId, type: "delivery_started" }
      );
      if (!pushResult.success) {
        console.error("[start-delivery] expo push failed:", pushResult.error);
      }
    }
  }

  return NextResponse.json({ deliveryId });
}
