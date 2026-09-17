import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLeadData } from "@/lib/meta";
import { decryptToken } from "@/lib/crypto";
import { sendExpoPushToOwner } from "@/lib/expo-push";
import { metaLead } from "@/lib/push-messages";
import { normalizePhoneNumber } from "@/lib/whatsapp";

// [N28W.1] Création d'une commande à partir d'un lead Meta.
// EXTRAIT VERBATIM du bloc `meta/leads/webhook/route.ts:150-216` (getLeadData → insert clients →
// insert orders → push vendeur `after()` → mark log 'order_created'). Refactor PUR : le webhook
// appelle ce helper AU MÊME POINT (après le gate abonnement + déchiffrement token), avec les mêmes
// opérations, les mêmes messages d'erreur (throw), les mêmes logs. Le catch appelant marque 'error'.
// Réutilisé par le REPLAY (replayBlockedLeads) à la réactivation d'un vendeur.
export async function createOrderFromLead(
  supabase: SupabaseClient,
  args: {
    leadgenId: string;
    formId: string;
    adId?: string | null;
    userId: string;
    pageToken: string;
    logId: string | undefined;
  }
): Promise<void> {
  const { leadgenId, formId, adId, userId, pageToken, logId } = args;

  // Fetch lead data from Graph API
  const lead = await getLeadData(leadgenId, pageToken);

  // Insert client row first
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      user_id: userId,
      full_name: lead.name ?? "Lead Meta Ads",
      phone: lead.phone ?? "",
      phone_normalized: lead.phone ? normalizePhoneNumber(lead.phone) || null : null,
      wilaya: lead.city ?? "",
      commune: lead.commune ?? "",
      address: "",
      notes: `Lead Meta Ads — form ${formId}`,
    })
    .select("id")
    .single();

  if (clientError || !client) throw new Error(`Client insert failed: ${clientError?.message}`);

  // Insert order
  const reference = `LV-META-${Date.now().toString(36).toUpperCase()}`;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      client_id: client.id,
      reference,
      status: "pending_confirmation",
      source: "meta_lead_ads",
      meta_lead_id: leadgenId,
      total_amount: 0,
      delivery_fee: 0,
      notes: `Lead Meta Ads${adId ? ` — Ad ID: ${adId}` : ""} — compléter produit + adresse`,
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(`Order insert failed: ${orderError?.message}`);

  // Push notification to vendor
  const { data: profile } = await supabase
    .from("profiles")
    .select("expo_push_token, locale")
    .eq("id", userId)
    .single();

  if (profile?.expo_push_token) {
    const { title, body } = metaLead(profile.locale, {
      clientName: lead.name ?? "Nouveau client",
    });
    const pushToken = profile.expo_push_token;
    const orderId = order.id;
    after(async () => {
      const r = await sendExpoPushToOwner(
        { type: "profile", id: userId, fallbackToken: pushToken },
        title, body, { orderId, type: "meta_lead" }
      );
      if (!r.success) console.error("[LOT1][A4] meta/leads/webhook sendExpoPush:", r.error);
    });
  }

  // Mark log as order created
  await supabase.from("meta_lead_logs")
    .update({ status: "order_created", order_id: order.id })
    .eq("id", logId);
}

// [N28W.1] REPLAY des leads bloqués pour cause d'abonnement expiré, à la RÉACTIVATION du vendeur.
// Déclenché via after() depuis le webhook billing (best-effort ISOLÉ : ne throw JAMAIS → n'échoue
// jamais le webhook billing). Idempotence : `orders.meta_lead_id` est UNIQUE (013:33) → zéro doublon ;
// createOrderFromLead marque le log 'order_created' → chaque lead n'est rejoué qu'UNE fois (le filtre
// `subscription_inactive` ne le matche plus). Échec (Graph/insert) → le log reste 'subscription_inactive'
// (REJOUABLE à la prochaine réactivation), jamais perdu. Borne 90 j (rétention). Attribution : meta_lead_logs
// n'a pas de user_id → join par page_id via meta_page_subscriptions (les pages du vendeur).
export async function replayBlockedLeads(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: pages } = await supabase
    .from("meta_page_subscriptions")
    .select("page_id, page_access_token")
    .eq("user_id", userId);
  const pageRows = (pages ?? []) as { page_id: string; page_access_token: string }[];
  if (pageRows.length === 0) return;
  const pageIds = pageRows.map((p) => p.page_id);
  const tokenByPage = new Map(pageRows.map((p) => [p.page_id, p.page_access_token] as const));

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: blocked } = await supabase
    .from("meta_lead_logs")
    .select("id, lead_id, page_id, form_id, raw_payload")
    .in("page_id", pageIds)
    .eq("error_message", "subscription_inactive")
    .gte("created_at", since);

  const rows = (blocked ?? []) as {
    id: string;
    lead_id: string;
    page_id: string;
    form_id: string | null;
    raw_payload: unknown;
  }[];

  for (const row of rows) {
    try {
      const storedToken = tokenByPage.get(row.page_id);
      if (!storedToken) continue;
      const pageToken = decryptToken(storedToken);
      const adId = (row.raw_payload as { ad_id?: string } | null)?.ad_id ?? null;
      await createOrderFromLead(supabase, {
        leadgenId: row.lead_id,
        formId: row.form_id ?? "",
        adId,
        userId,
        pageToken,
        logId: row.id,
      });
    } catch (e) {
      // Best-effort : échec → le log reste 'subscription_inactive' (rejouable), jamais throw.
      console.error(`[replay] lead ${row.lead_id} échec (reste rejouable):`, e instanceof Error ? e.message : "?");
    }
  }
}
