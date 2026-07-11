import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendExpoPush } from "@/lib/expo-push";
import { deliveryCancelled } from "@/lib/push-messages";

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
    .select("id, reference")
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
    const pushResult = await sendExpoPush(
      driver.expo_push_token,
      title,
      body,
      { orderId: id, deliveryId: delivery.id, type: "delivery_cancelled" }
    );
    if (!pushResult.success) {
      console.error("[orders/cancel-delivery] expo push failed:", pushResult.error);
    }
  }

  return NextResponse.json({ ok: true, cascaded: true });
}
