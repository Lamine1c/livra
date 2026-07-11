import { NextRequest, NextResponse } from "next/server";
import { verifyLocateToken } from "@/lib/qr-token";
import { createServiceClient } from "@/lib/supabase/service";
import { sendExpoPush } from "@/lib/expo-push";
import { buyerLocationConfirmed } from "@/lib/push-messages";

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

  // Idempotence check: fetch order before update to detect first-time location confirmation
  const { data: orderBefore } = await supabase
    .from("orders")
    .select("buyer_lat, user_id")
    .eq("id", result.orderId)
    .single();

  const wasAlreadyLocated = orderBefore?.buyer_lat != null;

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

  // Push notif to vendor — only on first location confirmation
  if (!wasAlreadyLocated && orderBefore?.user_id) {
    const { data: vendor } = await supabase
      .from("profiles")
      .select("expo_push_token, locale")
      .eq("id", orderBefore.user_id)
      .single();

    if (vendor?.expo_push_token) {
      const { title, body } = buyerLocationConfirmed(vendor.locale, {
        reference: result.orderId.slice(0, 8).toUpperCase(),
      });
      const pushResult = await sendExpoPush(
        vendor.expo_push_token,
        title,
        body,
        { orderId: result.orderId, type: "buyer_location_confirmed" }
      );
      if (!pushResult.success) {
        console.error("[locate] expo push failed:", pushResult.error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
