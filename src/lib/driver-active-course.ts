import type { SupabaseClient } from "@supabase/supabase-js";
import { orderDeliveryAddress } from "@/lib/order-address";

// [T3-1/T3-2] Objet « course active » exposé au livreur, avec EXACTEMENT les mêmes noms de champs que
// /api/scan (le mobile réutilise son parseur de scan). order = toutes les colonnes orders (sauf les
// sensibles, voir plus bas) + buyer_* aplatis + client + items.
export type ActiveCourseOrder = {
  orderId: string;
  order: Record<string, unknown>;
  vendorName: string;
  status_history: { status: string; created_at: string }[];
};

export type ActiveCourseResult = {
  deliveryId: string;
  orderId: string;
  // null si la commande est introuvable (cas limite : on garde quand même les IDs de la delivery).
  activeCourse: ActiveCourseOrder | null;
};

// Récupère la course ACTIVE d'un livreur (delivery `status='active'`) avec les infos COMPLÈTES de la
// commande. DURCI comme le scan : jamais `otp_code` (le livreur ne doit pas pouvoir confirmer l'OTP
// lui-même) ni `notes` vendeur. RÉSERVÉ au livreur : la commande n'est lue QUE via SA delivery active
// (driver_id + status). Retourne null s'il n'y a aucune course active. Partagé par /api/driver/me (reprise
// de course) et /api/driver/today (hub). Best-effort sur les jointures annexes (vendeur, timeline).
export async function getActiveCourse(
  supabase: SupabaseClient,
  driverId: string
): Promise<ActiveCourseResult | null> {
  const { data: activeDelivery } = await supabase
    .from("deliveries")
    .select("id, order_id")
    .eq("driver_id", driverId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!activeDelivery?.order_id) return null;

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      client:clients(full_name, phone, address, wilaya, commune),
      items:order_items(product_name, quantity, unit_price, total_price)
    `)
    .eq("id", activeDelivery.order_id)
    .single();

  if (!order) {
    // Cas limite : la delivery existe mais la commande est introuvable. On garde les IDs (contrat V5-2),
    // mais pas d'infos enrichies à exposer.
    console.error(`[driver] course active mais commande introuvable order=${activeDelivery.order_id}`);
    return { deliveryId: activeDelivery.id as string, orderId: activeDelivery.order_id as string, activeCourse: null };
  }

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

  // Durci : on retire les champs sensibles AVANT d'exposer la commande au livreur (copie mutable, pas de
  // `select` explicite → parité totale des autres noms de champs avec /api/scan).
  const safeOrder: Record<string, unknown> = { ...(order as Record<string, unknown>) };
  delete safeOrder.otp_code;
  delete safeOrder.notes;

  return {
    deliveryId: activeDelivery.id as string,
    orderId: order.id as string,
    activeCourse: {
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
    },
  };
}
