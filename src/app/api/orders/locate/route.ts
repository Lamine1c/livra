import { NextRequest, NextResponse } from "next/server";
import { verifyLocateToken } from "@/lib/qr-token";
import { createServiceClient } from "@/lib/supabase/service";
import { sendExpoPush } from "@/lib/expo-push";
import { buyerLocationConfirmed, buyerLocationUpdated, buyerLocationUpdatedDriver } from "@/lib/push-messages";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (!t) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const result = verifyLocateToken(t);
  if (!result.valid) {
    return NextResponse.json(
      { error: result.expired ? "Lien expiré" : "Lien invalide" },
      { status: result.expired ? 410 : 401 }
    );
  }

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, reference, total_amount, buyer_lat, buyer_lng, buyer_location_at, user_id")
    .eq("id", result.orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const { data: vendor } = await supabase
    .from("profiles")
    .select("store_name, full_name")
    .eq("id", order.user_id)
    .single();

  const vendorName = vendor?.store_name ?? vendor?.full_name ?? "Boutique";

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.reference,
    vendorName,
    alreadyConfirmed: order.buyer_lat != null,
    confirmedAt: order.buyer_location_at ?? null,
    buyerLat: order.buyer_lat ?? null,
    buyerLng: order.buyer_lng ?? null,
  });
}

export async function POST(req: NextRequest) {
  let body: { token?: string; lat?: number; lng?: number };
  try {
    body = await req.json() as { token?: string; lat?: number; lng?: number };
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { token, lat, lng } = body;
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const result = verifyLocateToken(token);
  if (!result.valid) {
    return NextResponse.json(
      { error: result.expired ? "Lien expiré" : "Lien invalide" },
      { status: result.expired ? 410 : 401 }
    );
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Coordonnées manquantes" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Idempotence check: fetch order before update to detect first-time location confirmation.
  // [N12-5] On lit AUSSI buyer_location_at (timestamp de la confirmation PRÉCÉDENTE) pour l'anti-spam.
  const { data: orderBefore } = await supabase
    .from("orders")
    .select("buyer_lat, buyer_location_at, user_id")
    .eq("id", result.orderId)
    .single();

  const wasAlreadyLocated = orderBefore?.buyer_lat != null;
  const prevLocatedAt = orderBefore?.buyer_location_at as string | null | undefined;

  const { error } = await supabase
    .from("orders")
    .update({
      buyer_lat: lat,
      buyer_lng: lng,
      buyer_location_at: new Date().toISOString(),
    })
    .eq("id", result.orderId);

  if (error) {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
  }

  // Push vendeur. 1re confirmation → « position confirmée ». Confirmations SUIVANTES → libellé
  // DISTINCT « position mise à jour » (le point a bougé, le livreur doit re-viser).
  // [N12-5] Anti-spam DURABLE via la colonne EXISTANTE buyer_location_at (aucun état mémoire, survit
  // au serverless, pas de migration) : on ne pousse la « mise à jour » que si la confirmation
  // PRÉCÉDENTE date de ≥ 10 min → au plus ~1 push « mise à jour » par commande / 10 min.
  const TEN_MIN_MS = 10 * 60 * 1000;
  const updateTooRecent =
    wasAlreadyLocated && !!prevLocatedAt && Date.now() - new Date(prevLocatedAt).getTime() < TEN_MIN_MS;

  if (orderBefore?.user_id && (!wasAlreadyLocated || !updateTooRecent)) {
    const { data: vendor } = await supabase
      .from("profiles")
      .select("expo_push_token, locale")
      .eq("id", orderBefore.user_id)
      .single();

    if (vendor?.expo_push_token) {
      const reference = result.orderId.slice(0, 8).toUpperCase();
      const { title, body } = wasAlreadyLocated
        ? buyerLocationUpdated(vendor.locale, { reference })
        : buyerLocationConfirmed(vendor.locale, { reference });
      const pushResult = await sendExpoPush(vendor.expo_push_token, title, body, {
        orderId: result.orderId,
        type: wasAlreadyLocated ? "buyer_location_updated" : "buyer_location_confirmed",
      });
      if (!pushResult.success) {
        console.error("[locate] expo push failed:", pushResult.error);
      }
    }
  }

  // [N14] ALERTE LIVREUR — sur une RE-confirmation (le client a bougé), si la commande a une COURSE
  // ACTIVE, prévenir aussi le livreur assigné : il navigue dans Google Maps EXTERNE (comgooglemaps://)
  // et ne voit PAS le changement in-app → il doit relancer l'itinéraire depuis LIVRA (coords à jour).
  // Même anti-spam que le vendeur (≥10 min via buyer_location_at → updateTooRecent). 1re confirmation :
  // pas d'alerte (rien n'a « changé »). Aucune course active / pas de livreur → seul le vendeur reçoit.
  // Best-effort STRICT : échec loggé, ne bloque NI la réponse NI l'enregistrement déjà fait.
  if (wasAlreadyLocated && !updateTooRecent) {
    // Course active liée à la commande + livreur assigné (deliveries.status='active', driver_id non null).
    const { data: activeDelivery } = await supabase
      .from("deliveries")
      .select("driver_id")
      .eq("order_id", result.orderId)
      .eq("status", "active")
      .not("driver_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (activeDelivery?.driver_id) {
      const { data: driver } = await supabase
        .from("drivers")
        .select("expo_push_token, locale")
        .eq("id", activeDelivery.driver_id)
        .maybeSingle();

      if (driver?.expo_push_token) {
        const { title, body } = buyerLocationUpdatedDriver(driver.locale as string | null);
        const r = await sendExpoPush(driver.expo_push_token, title, body, {
          orderId: result.orderId,
          type: "buyer_location_updated_driver",
        });
        if (!r.success) console.error("[locate] driver alert push failed:", r.error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
