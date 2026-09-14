import { NextRequest, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyWebhookSignature, getLeadData } from "@/lib/meta";
import { decryptToken, encryptToken, isEncrypted } from "@/lib/crypto";
import { sendExpoPush } from "@/lib/expo-push";
import { metaLead } from "@/lib/push-messages";
import { normalizePhoneNumber } from "@/lib/whatsapp";
import { requireActiveSubscription } from "@/lib/billing-guard";

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

      // Log réception — UPSERT onConflict(lead_id) (N10-1). Une re-livraison Meta d'un lead
      // déjà en 'received'/'error' RE-STAGE la MÊME ligne (status→'received', on efface l'état
      // d'erreur/order précédent) au lieu de créer un DOUBLON (l'ancien insert aveugle en créait
      // un à chaque retry après 'error'). L'idempotence reste garantie par le court-circuit
      // 'order_created' ci-dessus : un lead déjà converti n'est jamais ré-écrasé. Le retraitement
      // après 'error' est PRÉSERVÉ (même ligne re-traitée, même logId).
      // 🔴 Requiert un index UNIQUE(lead_id) plein — migration 040 (à déployer AVEC ce code).
      const { data: log } = await supabase
        .from("meta_lead_logs")
        .upsert(
          {
            lead_id: leadgenId,
            page_id: pageId,
            form_id: formId,
            raw_payload: change.value,
            status: "received",
            error_message: null,
            order_id: null,
          },
          { onConflict: "lead_id" }
        )
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

        // [N3-ENFORCEMENT] Le webhook tourne en SERVICE ROLE → il contourne la RLS. On vérifie
        // donc EXPLICITEMENT le statut d'abonnement du vendeur AVANT toute création (avant même
        // l'appel Graph). Décision Claudy (réversible) : un lead rejeté est JOURNALISÉ
        // (status=error + reason 'subscription_inactive'), PAS ignoré — le raw_payload déjà
        // stocké dans la ligne 'received' permet un replay ultérieur (pas de replay cette nuit).
        // Fail-open (billing-guard : vendeur inconnu / panne DB → allowed) : on ne bloque que
        // les expirations avérées, jamais un vendeur légitime sur un hoquet.
        const { data: vendorProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", subscription.user_id)
          .maybeSingle();
        if (vendorProfile?.email) {
          const gate = await requireActiveSubscription(vendorProfile.email);
          if (!gate.allowed) {
            await supabase.from("meta_lead_logs")
              .update({ status: "error", error_message: "subscription_inactive" })
              .eq("id", logId);
            console.error(`[meta/webhook] lead rejeté — abonnement ${gate.status} (vendor ${subscription.user_id})`);
            continue;
          }
        }

        // Déchiffre le token de page (legacy en clair → retourné tel quel).
        const storedPageToken = subscription.page_access_token;
        const pageToken = decryptToken(storedPageToken);

        // Ré-encryption LAZY : si le token stocké est encore en clair (legacy),
        // on le ré-écrit chiffré dans la même ligne, best-effort, hors chemin
        // critique (after()). Jamais le token dans un log.
        if (!isEncrypted(storedPageToken)) {
          const subUserId = subscription.user_id;
          after(async () => {
            try {
              const { error } = await supabase
                .from("meta_page_subscriptions")
                .update({ page_access_token: encryptToken(storedPageToken) })
                .eq("user_id", subUserId)
                .eq("page_id", pageId);
              if (error) console.error("[meta/webhook] ré-encryption token échouée:", error.message);
            } catch (e) {
              console.error("[meta/webhook] ré-encryption token échouée:", e instanceof Error ? e.message : "erreur inconnue");
            }
          });
        }

        // Fetch lead data from Graph API
        const lead = await getLeadData(leadgenId, pageToken);

        // Insert client row first
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: subscription.user_id,
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
          .select("expo_push_token, locale")
          .eq("id", subscription.user_id)
          .single();

        if (profile?.expo_push_token) {
          const { title, body } = metaLead(profile.locale, {
            clientName: lead.name ?? "Nouveau client",
          });
          // [LOT1][A4] after() par itération (boucle leads) : sans lui, un `void`
          // pouvait être tué par Vercel après la réponse 200 → le vendeur ne recevait
          // JAMAIS la notif de son lead Facebook. sendExpoPush renvoie { success, error }.
          const pushToken = profile.expo_push_token;
          const orderId = order.id;
          after(async () => {
            const r = await sendExpoPush(pushToken, title, body, { orderId, type: "meta_lead" });
            if (!r.success) console.error("[LOT1][A4] meta/leads/webhook sendExpoPush:", r.error);
          });
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
