import type { SupabaseClient } from "@supabase/supabase-js";
import { generateOTP, sendWhatsAppTemplate, normalizePhoneNumber } from "@/lib/whatsapp";
import { TEMPLATES } from "@/lib/whatsapp-templates";

export type SendOrderOtpResult =
  | { ok: true; maskedPhone: string }
  | { ok: false; status: number; error: string };

// [T1-3] Cœur de l'envoi MSG 1 (order_confirmation_request) + génération/persistance de l'OTP, avec
// le `total_amount` COURANT lu en base au moment de l'envoi. Extrait de /api/orders/[id]/send-otp pour
// être réutilisé par refusal-reply (auto-envoi sur « oui » à l'offre winback) SANS dupliquer la logique.
//
// Ce que le helper fait : (ré)utilise un code actif non expiré (idempotent, 24h T0A-1) ou en génère un,
// persiste otp_code/otp_expires_at/otp_sent_at (→ le statut « code déjà envoyé » pour le mobile), remet
// otp_attempts à 0 sur un code neuf, puis envoie MSG 1 (variante split si MSG1_SPLIT_TEMPLATE_READY).
// Ce que le helper NE fait PAS (reste la responsabilité de l'appelant HTTP /send-otp) : auth, ownership,
// cooldown 60 s, gate abonnement, garde « déjà confirmée ». Côté refusal-reply l'appel est best-effort.
export async function sendOrderConfirmationOtp(
  supabase: SupabaseClient,
  orderId: string
): Promise<SendOrderOtpResult> {
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select(
      "id, user_id, otp_code, otp_expires_at, total_amount, delivery_fee, client:clients(full_name, phone), items:order_items(product_name)"
    )
    .eq("id", orderId)
    .single();

  if (fetchError || !order) return { ok: false, status: 404, error: "Commande introuvable" };

  const clientRaw = order.client;
  const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as
    | { full_name?: string; phone?: string }
    | null
    | undefined;
  if (!client?.phone) return { ok: false, status: 400, error: "Client introuvable" };

  // Idempotence : réutilise un code ACTIF (non expiré, non vérifié) au lieu d'en régénérer un — sinon
  // un renvoi (double-clic / auto-envoi winback après un envoi vendeur) invaliderait le code déjà reçu.
  const nowMs = Date.now();
  const activeCode =
    order.otp_code && order.otp_expires_at && new Date(order.otp_expires_at).getTime() > nowMs
      ? order.otp_code
      : null;
  const otp = activeCode ?? generateOTP();
  const expiresAt =
    activeCode && order.otp_expires_at
      ? order.otp_expires_at
      : new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
  const sentAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({ otp_code: otp, otp_expires_at: expiresAt, otp_sent_at: sentAt })
    .eq("id", orderId);
  if (updateError) return { ok: false, status: 500, error: "Erreur base de données" };

  // Code neuf → reset du plafond d'essais (best-effort, migration 052). Pas de reset sur réutilisation.
  if (!activeCode) {
    const { error: resetError } = await supabase.from("orders").update({ otp_attempts: 0 }).eq("id", orderId);
    if (resetError) {
      console.warn(`[send-otp] reset otp_attempts ignoré (migration 052 non appliquée ?) order=${orderId}:`, resetError.message);
    }
  }

  const { data: vendor } = await supabase.from("profiles").select("store_name, full_name").eq("id", order.user_id).single();
  const boutique = vendor?.store_name ?? vendor?.full_name ?? "votre vendeur";

  const itemsRaw = (order as { items?: unknown }).items;
  const items = (Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : []) as { product_name: string }[];
  const produit = items[0]?.product_name ?? null;

  const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
  // en-US (virgule) et PAS fr-FR : fr-FR insère un espace insécable étroit U+202F qui casse le wrap bidi.
  const total = Number(order.total_amount ?? 0);
  const totalTxt = new Intl.NumberFormat("en-US").format(Math.round(total));
  const produitTxt = produit ?? "";

  // [T0C-3] total_amount = montant À LA PORTE, frais INCLUS. Variante split : {{4}}=total−fee, {{5}}=fee.
  const deliveryFee = Number((order as { delivery_fee?: number | null }).delivery_fee ?? 0);
  const productPriceTxt = new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(total - deliveryFee)));
  const splitReady = process.env.MSG1_SPLIT_TEMPLATE_READY === "true" && deliveryFee > 0;

  const splitTemplate = {
    ...TEMPLATES.order_confirmation_request_split,
    name: process.env.MSG1_SPLIT_TEMPLATE_NAME ?? "order_confirmation_request_split",
  };
  const result = splitReady
    ? await sendWhatsAppTemplate(client.phone, splitTemplate, [
        prenom,
        boutique,
        produitTxt,
        productPriceTxt, // {{4}} = prix produit = total_amount − delivery_fee
        new Intl.NumberFormat("en-US").format(Math.round(deliveryFee)), // {{5}} = frais livraison
      ])
    : await sendWhatsAppTemplate(client.phone, TEMPLATES.order_confirmation_request, [
        prenom,
        boutique,
        produitTxt,
        totalTxt,
      ]);

  if (!result.success) return { ok: false, status: 502, error: result.error ?? "Échec envoi WhatsApp" };

  const normalized = normalizePhoneNumber(client.phone);
  const masked = "+" + normalized.slice(0, 5) + "XXXXX" + normalized.slice(-2);
  return { ok: true, maskedPhone: masked };
}
