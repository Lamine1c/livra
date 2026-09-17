import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendExpoPushToOwner } from "@/lib/expo-push";
import { deliveryCancelled } from "@/lib/push-messages";
import { sendTunnelMessage } from "@/lib/whatsapp";
import { TEMPLATES } from "@/lib/whatsapp-templates";

// F1 — Cascade d'annulation vendeur → livraison "Livreur perso" (moto_perso).
//
// Choix d'archi : le mobile vendeur passe la commande à "cancelled" via un
// update Supabase direct (RLS + Realtime = source de vérité), PUIS appelle
// cette route qui ne fait QUE la cascade : annuler la delivery active liée
// et notifier le livreur par push Expo. Idempotent : sans delivery active,
// répond ok/cascaded:false.
//
// Auth vendeur : getAuthenticatedUser + ownership user_id — même pattern que
// /api/orders/[id]/cancel-carrier.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthenticatedUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  // Ownership : la commande doit appartenir au vendeur authentifié.
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, reference, client_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Delivery active liée ? Statuts réels : active | completed | cancelled
  // (migration 008). Table deliveries verrouillée par RLS (migration 020)
  // → lecture/écriture via le service client.
  const service = createServiceClient();
  const { data: delivery, error: delFetchErr } = await service
    .from("deliveries")
    .select("id, driver_id, status")
    .eq("order_id", id)
    .eq("status", "active")
    .maybeSingle();

  if (delFetchErr) {
    console.error("[orders/cancel-delivery] deliveries fetch failed:", delFetchErr.message);
    return NextResponse.json({ error: "Lecture livraison impossible" }, { status: 500 });
  }

  if (!delivery) {
    // Pas de course active : rien à annuler (idempotent).
    return NextResponse.json({ ok: true, cascaded: false });
  }

  const now = new Date().toISOString();
  const { error: updErr } = await service
    .from("deliveries")
    .update({ status: "cancelled", completed_at: now })
    .eq("id", delivery.id);

  if (updErr) {
    console.error("[orders/cancel-delivery] delivery update failed:", updErr.message);
    return NextResponse.json({ error: "Annulation livraison impossible" }, { status: 500 });
  }

  // Push Expo au livreur — best-effort, ne bloque pas la cascade.
  const { data: driver } = await service
    .from("drivers")
    .select("expo_push_token, locale")
    .eq("id", delivery.driver_id)
    .maybeSingle();

  if (driver?.expo_push_token) {
    const reference = order.reference ?? `#${id.slice(0, 8).toUpperCase()}`;
    const { title, body } = deliveryCancelled(driver.locale, { reference });
    const pushResult = await sendExpoPushToOwner(
      { type: "driver", id: delivery.driver_id, fallbackToken: driver.expo_push_token },
      title, body, { orderId: id, deliveryId: delivery.id, type: "delivery_cancelled" }
    );
    if (!pushResult.success) {
      console.error("[orders/cancel-delivery] expo push failed:", pushResult.error);
    }
  }

  // [N33W.2 · B2] WhatsApp ACHETEUR : sa commande était EN ROUTE (delivery active) et le vendeur
  // vient de l'annuler → il DOIT être prévenu (avant, silence total côté acheteur). Même mécanique
  // que driver/cancel-delivery : fenêtre 24h (texte libre) puis repli template order_delivery_cancelled
  // ({{1}}=référence) hors fenêtre — AUCUN nouveau template. Best-effort (échec propre loggé), ne bloque
  // pas la cascade. Idempotent : ne part que sur la transition active→cancelled (2e appel = pas de
  // delivery active → early-return plus haut, donc pas de 2e envoi).
  if (order.client_id) {
    const { data: buyer } = await service
      .from("clients")
      .select("phone")
      .eq("id", order.client_id)
      .maybeSingle();
    if (buyer?.phone) {
      const reference = order.reference ?? `#${id.slice(0, 8).toUpperCase()}`;
      const r = await sendTunnelMessage(buyer.phone, TEMPLATES.order_delivery_cancelled, [reference]);
      if (!r.success) {
        console.error("[orders/cancel-delivery] buyer WhatsApp failed:", r.error);
      }
    }
  }

  return NextResponse.json({ ok: true, cascaded: true });
}
