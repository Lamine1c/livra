import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";
import { orderDeliveryAddress } from "@/lib/order-address";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const verified = verifyDriverToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  // Fetch driver basics
  const { data: driver, error: dErr } = await supabase
    .from("drivers")
    .select("id, prenom")
    .eq("id", verified.driverId)
    .maybeSingle();

  if (dErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Fetch active delivery (if any). status="active" = course active.
  // ⚠️ CORRECTION vs brief : le schéma (migrations 006/008) impose status ∈
  // {active, completed, cancelled} — "in_progress" n'existe plus (CHECK le rejette).
  // L'ancien crash recovery filtrait sur "in_progress" → cassé depuis migration 008.
  const { data: activeDelivery } = await supabase
    .from("deliveries")
    .select("id, order_id")
    .eq("driver_id", driver.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  // [T3-1] Reprise d'une course (V5-2) : avant, le mobile ne recevait que les UUID
  // (activeOrderId/activeDeliveryId) → écran sans nom client, sans téléphone, sans montant, et
  // référence = UUID au lieu de « LV-… ». On joint ici les infos COMPLÈTES de la commande de la
  // course active, sous `activeCourse`, avec EXACTEMENT les mêmes noms de champs que /api/scan
  // (le mobile réutilise son parseur de scan — lot M4-5). Durci comme le scan : pas d'`otp_code`
  // (le livreur ne doit jamais pouvoir confirmer l'OTP lui-même), pas de `notes` vendeur. Réservé
  // au livreur de CETTE course : la commande n'est lue QUE via sa delivery active (driver_id + status).
  let activeCourse: {
    orderId: string;
    order: Record<string, unknown>;
    vendorName: string;
    status_history: { status: string; created_at: string }[];
  } | null = null;

  if (activeDelivery?.order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select(`
        *,
        client:clients(full_name, phone, address, wilaya, commune),
        items:order_items(product_name, quantity, unit_price, total_price)
      `)
      .eq("id", activeDelivery.order_id)
      .single();

    if (order) {
      const client = order.client
        ? (Array.isArray(order.client) ? order.client[0] : order.client)
        : null;
      const dest = orderDeliveryAddress(
        order as { ship_wilaya?: string | null; ship_commune?: string | null; ship_address?: string | null },
        client
      );

      const { data: vendor } = await supabase
        .from("profiles")
        .select("full_name, store_name")
        .eq("id", (order as { user_id: string }).user_id)
        .maybeSingle();

      const { data: statusHistory } = await supabase
        .from("order_status_history")
        .select("status, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });

      // Durci : on retire les champs sensibles AVANT d'exposer la commande au livreur (copie mutable,
      // pas de `select` explicite → parité totale des autres noms de champs avec /api/scan).
      const safeOrder: Record<string, unknown> = { ...(order as Record<string, unknown>) };
      delete safeOrder.otp_code;
      delete safeOrder.notes;

      activeCourse = {
        orderId: order.id as string,
        order: {
          ...safeOrder,
          buyer_name: client?.full_name ?? null,
          buyer_phone: client?.phone ?? null,
          buyer_address: dest.address,
          buyer_wilaya: dest.wilaya,
          buyer_commune: dest.commune,
        },
        vendorName: vendor?.store_name ?? vendor?.full_name ?? "Vendeur LIVRA",
        status_history: (statusHistory as { status: string; created_at: string }[] | null) ?? [],
      };
    } else {
      console.error(`[driver/me] course active mais commande introuvable order=${activeDelivery.order_id}`);
    }
  }

  return NextResponse.json({
    id: driver.id,
    prenom: driver.prenom,
    hasActiveDelivery: !!activeDelivery,
    activeDeliveryId: activeDelivery?.id ?? null,
    activeOrderId: activeDelivery?.order_id ?? null,
    activeCourse,
  });
}
