import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyBuyerToken } from "@/lib/qr-token";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (!t) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const result = verifyBuyerToken(t);
  if (!result.valid) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("status, delivered_at")
    .eq("id", result.orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: delivery } = await supabase
    .from("deliveries")
    .select("last_lat, last_lng, status")
    .eq("order_id", result.orderId)
    .maybeSingle();

  // P5 — une commande/delivery terminée (livrée, returned, cancelled) ne doit PLUS
  // exposer la position du livreur (pas qu'un défaut d'affichage). On coupe lastLat/lng
  // côté serveur ; le statut reste renvoyé pour l'état de fin côté acheteur.
  const orderStatus = order.status as string;
  const deliveryStatus = (delivery?.status as string | null) ?? null;
  const ended =
    orderStatus === "delivered" || orderStatus === "returned" || orderStatus === "cancelled" ||
    deliveryStatus === "completed" || deliveryStatus === "cancelled";

  return NextResponse.json({
    orderStatus,
    deliveredAt: (order.delivered_at as string | null) ?? null,
    delivery: delivery
      ? {
          lastLat: ended ? null : (delivery.last_lat as number | null),
          lastLng: ended ? null : (delivery.last_lng as number | null),
          deliveryStatus,
        }
      : null,
  });
}
