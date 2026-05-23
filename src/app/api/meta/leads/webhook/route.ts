import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyWebhookSignature, getLeadData } from "@/lib/meta";
import { sendExpoPush } from "@/lib/expo-push";

// GET — Meta webhook verification handshake
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// POST — Lead event from Meta
export async function POST(req: NextRequest) {
  // Read raw body FIRST (cannot be re-read after this)
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    console.error("[meta/webhook] META_APP_SECRET not configured");
    return new Response("OK", { status: 200 });
  }

  if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return new Response("OK", { status: 200 });
  }

  const supabase = createServiceClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;

      const { leadgen_id: leadgenId, page_id: pageId, form_id: formId, ad_id: adId } = change.value;

      // Idempotency — skip if this lead already produced an order
      const { data: alreadyProcessed } = await supabase
        .from("meta_lead_logs")
        .select("id")
        .eq("lead_id", leadgenId)
        .eq("status", "order_created")
        .maybeSingle();

      if (alreadyProcessed) continue;

      // Log reception
      const { data: log } = await supabase
        .from("meta_lead_logs")
        .insert({ lead_id: leadgenId, page_id: pageId, form_id: formId, raw_payload: change.value, status: "received" })
        .select("id")
        .single();
      const logId = log?.id;

      try {
        // Find active page subscription to get page token + vendor id
        const { data: subscription } = await supabase
          .from("meta_page_subscriptions")
          .select("user_id, page_access_token")
          .eq("page_id", pageId)
          .eq("active", true)
          .maybeSingle();

        if (!subscription) {
          await supabase.from("meta_lead_logs")
            .update({ status: "error", error_message: `No active subscription for page ${pageId}` })
            .eq("id", logId);
          continue;
        }

        // Fetch lead data from Graph API
        const lead = await getLeadData(leadgenId, subscription.page_access_token);

        // Insert client row first
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: subscription.user_id,
            full_name: lead.name ?? "Lead Meta Ads",
            phone: lead.phone ?? "",
            wilaya: lead.city ?? "",
            commune: "",
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
            user_id: subscription.user_id,
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
          .select("expo_push_token")
          .eq("id", subscription.user_id)
          .single();

        if (profile?.expo_push_token) {
          void sendExpoPush(
            profile.expo_push_token,
            "🎯 Nouveau lead Meta Ads",
            `${lead.name ?? "Nouveau client"} — complétez la commande dans LIVRA`,
            { orderId: order.id, type: "meta_lead" }
          );
        }

        // Mark log as order created
        await supabase.from("meta_lead_logs")
          .update({ status: "order_created", order_id: order.id })
          .eq("id", logId);
      } catch (err) {
        console.error("[meta/webhook] lead processing error:", err);
        await supabase.from("meta_lead_logs")
          .update({ status: "error", error_message: String(err) })
          .eq("id", logId);
      }
    }
  }

  // Always 200 — Meta retries aggressively on any other status
  return new Response("OK", { status: 200 });
}

type MetaWebhookPayload = {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: {
        leadgen_id: string;
        page_id: string;
        form_id: string;
        ad_id?: string;
        created_time: number;
      };
    }>;
  }>;
};
