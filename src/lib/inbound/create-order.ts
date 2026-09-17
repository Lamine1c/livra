import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePhoneNumber } from "@/lib/whatsapp";
import { inboundOrder } from "@/lib/push-messages";
import { sendExpoPushToOwner } from "@/lib/expo-push";
import type { InboundOrderInput } from "./schema";

// LOT 13 · Porte n°1 — création d'une commande depuis l'API. Reproduit la séquence du
// webhook Meta (leads/webhook/route.ts:88-121) : clients → orders → order_items, avec
// idempotence par (user_id, source='api', external_order_id) — index unique partiel 035.

// source : 'api' (porte 1, défaut) ou 'email' (porte 0). Détermine le namespace
// d'idempotence (index unique partiel 035 sur user_id, source, external_order_id).
type InboundSource = "api" | "email";
type InboundCtx = { userId: string; supabase: SupabaseClient; source?: InboundSource };

export type InboundResult = { duplicate: boolean; orderId: string; reference: string };

// ─── Journal : une ligne inbound_events par requête. JAMAIS le payload brut. ──
type EventStatus = "received" | "order_created" | "rejected" | "error";

export async function logInboundEvent(
  supabase: SupabaseClient,
  e: {
    sourceId: string | null;
    userId: string | null;
    status: EventStatus;
    kind?: string; // 'api' (défaut, porte 1) | 'email' | 'email_webhook'
    rejectReason?: string | null;
    errorMessage?: string | null;
    orderId?: string | null;
    externalRef?: string | null;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from("inbound_events").insert({
      source_id: e.sourceId,
      user_id: e.userId,
      kind: e.kind ?? "api",
      external_ref: e.externalRef ?? null,
      status: e.status,
      reject_reason: e.rejectReason ?? null,
      error_message: e.errorMessage ?? null,
      order_id: e.orderId ?? null,
    });
    if (error) console.error("[inbound/orders] event insert:", error.message);
  } catch (err) {
    console.error("[inbound/orders] event insert threw:", err);
  }
}

export async function createInboundOrder(
  input: InboundOrderInput,
  ctx: InboundCtx
): Promise<InboundResult> {
  const { userId, supabase } = ctx;
  const source = ctx.source ?? "api";

  // 1) Idempotence — pré-check avant toute écriture.
  const { data: existing } = await supabase
    .from("orders")
    .select("id, reference")
    .eq("user_id", userId)
    .eq("source", source)
    .eq("external_order_id", input.external_order_id)
    .maybeSingle();
  if (existing) {
    return { duplicate: true, orderId: existing.id as string, reference: existing.reference as string };
  }

  // 2) Lignes de commande + totaux (unit_price optionnel → 0 ; total_amount optionnel → somme).
  const items = input.items.map((it) => {
    const unit = it.unit_price ?? 0;
    return {
      product_name: it.product_name,
      quantity: it.quantity,
      unit_price: unit,
      total_price: unit * it.quantity,
    };
  });
  const totalAmount = input.total_amount ?? items.reduce((s, it) => s + it.total_price, 0);
  const deliveryFee = input.delivery_fee ?? 0;

  // 3) Client d'abord (comme le webhook Meta). buyer.notes → clients.notes (orders.notes
  //    porte le libellé de source).
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      full_name: input.buyer.full_name,
      phone: input.buyer.phone,
      phone_normalized: normalizePhoneNumber(input.buyer.phone) || null,
      wilaya: input.buyer.wilaya,
      commune: input.buyer.commune,
      address: input.buyer.address ?? "",
      notes: input.buyer.notes ?? null,
    })
    .select("id")
    .single();
  if (clientError || !client) throw new Error(`Client insert failed: ${clientError?.message}`);

  // 4) Order — l'index unique partiel 035 garantit l'idempotence même en course.
  const reference = `LV-${source === "email" ? "EML" : "API"}-${Date.now().toString(36).toUpperCase()}`;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      client_id: client.id,
      reference,
      status: "pending_confirmation",
      source,
      external_order_id: input.external_order_id,
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      notes: input.source_label ?? (source === "email" ? "Commande email" : "Commande API"),
    })
    .select("id")
    .single();

  if (orderError) {
    // 23505 = violation de l'unique partiel : une autre requête a gagné la course entre
    // le pré-check et l'insert. On supprime le client orphelin qu'ON VIENT DE CRÉER
    // (seul delete autorisé) et on relit la commande gagnante.
    if (orderError.code === "23505") {
      await supabase.from("clients").delete().eq("id", client.id);
      const { data: won } = await supabase
        .from("orders")
        .select("id, reference")
        .eq("user_id", userId)
        .eq("source", source)
        .eq("external_order_id", input.external_order_id)
        .maybeSingle();
      if (won) return { duplicate: true, orderId: won.id as string, reference: won.reference as string };
      throw new Error("Order conflict (23505) but winning row not found");
    }
    // Autre erreur : on nettoie aussi le client orphelin, puis on propage.
    await supabase.from("clients").delete().eq("id", client.id);
    throw new Error(`Order insert failed: ${orderError.message}`);
  }
  if (!order) throw new Error("Order insert returned no row");

  // 5) order_items.
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((it) => ({ order_id: order.id, ...it })));
  if (itemsError) throw new Error(`Order items insert failed: ${itemsError.message}`);

  // 6) Push vendeur — message inboundOrder() (« commande boutique », MÊME sémantique que la
  //    porte email ; PAS le placeholder metaLead(), réservé désormais au seul webhook Meta Ads).
  //    [N24.1] `type` DÉDIÉ `"inbound_order"` (email + API) au lieu du placeholder `"meta_lead"` :
  //    une commande ingérée n'est PAS un lead Meta, la source ne doit plus être confondue.
  //    ⚠️ Coordination mobile : l'app doit router `inbound_order` (au tap) comme une commande
  //    (fallback : type inconnu → ouverture par défaut, aucune régression sur les AUTRES types).
  //    Best-effort via after().
  const { data: profile } = await supabase
    .from("profiles")
    .select("expo_push_token, locale")
    .eq("id", userId)
    .single();
  if (profile?.expo_push_token) {
    const { title, body } = inboundOrder(profile.locale, { clientName: input.buyer.full_name });
    const pushToken = profile.expo_push_token as string;
    const orderId = order.id as string;
    after(async () => {
      const r = await sendExpoPushToOwner(
        { type: "profile", id: userId, fallbackToken: pushToken },
        title, body, { orderId, type: "inbound_order" }
      );
      if (!r.success) console.error("[inbound/orders] sendExpoPush:", r.error);
    });
  }

  return { duplicate: false, orderId: order.id as string, reference };
}
