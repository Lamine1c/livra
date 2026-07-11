import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneNumber, sendWhatsAppNotification } from "@/lib/whatsapp";
import { TEMPLATES, renderTemplateText } from "@/lib/whatsapp-templates";
import { sendExpoPush } from "@/lib/expo-push";
import { orderCancelled } from "@/lib/push-messages";

// Cœur provider-agnostic de l'auto-confirmation par réponse WhatsApp entrante.
// Appelé par la route inbound (360dialog puis Meta direct — même format Cloud API).
//
// Règle Bible : endpoint + SERVICE ROLE (pas d'auth vendeur) + validation.
// Le match se fait par TÉLÉPHONE (le client n'a pas de session), jamais par user_id.

export type InboundConfirmResult =
  | { matched: true; orderId: string }
  | { matched: false; reason: "not_a_code" | "no_pending_order" | "wrong_code" | "db_error" };

// Téléphone masqué pour les logs (jamais le numéro complet en clair).
function maskFrom(phone: string): string {
  const n = normalizePhoneNumber(phone);
  if (n.length < 7) return "***";
  return n.slice(0, 5) + "XXXXX" + n.slice(-2);
}

type PendingOrder = {
  id: string;
  otp_code: string | null;
  otp_sent_at: string | null;
  client: { phone: string } | { phone: string }[] | null;
};

function clientPhone(o: PendingOrder): string {
  const c = Array.isArray(o.client) ? o.client[0] : o.client;
  return c?.phone ?? "";
}

// Variante enrichie pour le tunnel objection : ramène aussi user_id (→ boutique
// via profiles) et full_name (→ prénom). Type dédié pour ne pas polluer
// PendingOrder, dont le SELECT inline de confirmOrderByInboundCode reste intact.
type PendingOrderEnriched = {
  id: string;
  otp_code: string | null;
  otp_sent_at: string | null;
  user_id: string;
  client: { full_name: string; phone: string } | { full_name: string; phone: string }[] | null;
};

function enrichedClient(o: PendingOrderEnriched): { full_name: string; phone: string } | null {
  const c = Array.isArray(o.client) ? o.client[0] : o.client;
  return c ?? null;
}

/**
 * Tente de confirmer une commande à partir d'un message WhatsApp entrant.
 * Edge cases V1 = silencieux (on ignore, on ne répond rien au client) :
 *   - body n'est pas un code 6 chiffres
 *   - aucun order en attente pour ce numéro
 *   - mauvais code
 *   - plusieurs orders même numéro → le plus récent otp_sent_at qui matche
 */
export async function confirmOrderByInboundCode(
  phone: string,
  body: string
): Promise<InboundConfirmResult> {
  const masked = maskFrom(phone);
  const code = body.trim();

  // Edge : pas un code 6 chiffres → ignore
  if (!/^\d{6}$/.test(code)) {
    console.log(`[whatsapp/inbound] from=${masked} no-match (body n'est pas un code 6 chiffres)`);
    return { matched: false, reason: "not_a_code" };
  }

  const supabase = createAdminClient();
  const phoneNorm = normalizePhoneNumber(phone);
  const nowIso = new Date().toISOString();

  // Tous les orders avec un OTP en cours (non vérifié, non expiré), du plus récent au plus ancien.
  // Le format du téléphone stocké côté client varie (0…, +213…, 213…) → on filtre en JS
  // sur le numéro normalisé. L'ensemble est petit (uniquement les commandes en attente d'OTP).
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, otp_code, otp_sent_at, client:clients(phone)")
    .not("otp_code", "is", null)
    .is("otp_verified_at", null)
    .gt("otp_expires_at", nowIso)
    .order("otp_sent_at", { ascending: false });

  if (error) {
    console.error(`[whatsapp/inbound] from=${masked} db-error (select pending):`, error.message);
    return { matched: false, reason: "db_error" };
  }

  const pending = (orders ?? []) as PendingOrder[];
  const sameNumber = pending.filter((o) => normalizePhoneNumber(clientPhone(o)) === phoneNorm);

  if (sameNumber.length === 0) {
    console.log(`[whatsapp/inbound] from=${masked} no-match (aucun order en attente pour ce numéro)`);
    return { matched: false, reason: "no_pending_order" };
  }

  // Le plus récent otp_sent_at qui matche le code (la liste est déjà triée desc).
  const match = sameNumber.find((o) => o.otp_code === code);
  if (!match) {
    console.log(`[whatsapp/inbound] from=${masked} no-match (code incorrect, ${sameNumber.length} order(s) en attente)`);
    return { matched: false, reason: "wrong_code" };
  }

  // Confirmation — exactement la logique de verify-otp.
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "confirmed",
      otp_verified_at: nowIso,
      otp_code: null,
      updated_at: nowIso,
    })
    .eq("id", match.id);

  if (updateError) {
    console.error(`[whatsapp/inbound] from=${masked} db-error (update confirm) order=${match.id}:`, updateError.message);
    return { matched: false, reason: "db_error" };
  }

  console.log(`[whatsapp/inbound] from=${masked} match → order ${match.id} confirmé`);

  // Accusé de confirmation + badge réputation "client vérifié" (best-effort :
  // un échec d'envoi ne doit PAS faire échouer la confirmation déjà persistée).
  const confirmMsg = renderTemplateText(TEMPLATES.order_confirmed_verified, []);
  const r = await sendWhatsAppNotification(phone, confirmMsg);
  if (!r.success) console.error(`[whatsapp/inbound] from=${masked} accusé confirmation failed:`, r.error);

  return { matched: true, orderId: match.id };
}

// ─── Helper : commandes en attente d'OTP pour un numéro (récent → ancien) ──
// Même requête que confirmOrderByInboundCode (gardée intacte) ; le filtre téléphone
// se fait en JS sur le numéro normalisé (formats stockés variables).
async function findPendingForPhone(
  phone: string
): Promise<{ orders: PendingOrderEnriched[]; dbError: boolean }> {
  const supabase = createAdminClient();
  const phoneNorm = normalizePhoneNumber(phone);
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("id, otp_code, otp_sent_at, user_id, client:clients(full_name, phone)")
    .not("otp_code", "is", null)
    .is("otp_verified_at", null)
    .gt("otp_expires_at", nowIso)
    .order("otp_sent_at", { ascending: false });

  if (error) return { orders: [], dbError: true };
  const pending = (data ?? []) as PendingOrderEnriched[];
  const sameNumber = pending.filter(
    (o) => normalizePhoneNumber(enrichedClient(o)?.phone ?? "") === phoneNorm
  );
  return { orders: sameNumber, dbError: false };
}

export type InboundReplyResult =
  | { action: "code_sent"; orderId: string }
  | { action: "no_pending" }
  | { action: "declined" }
  | { action: "reschedule"; orderId: string }
  | { action: "cancelled_mind"; orderId: string }
  | { action: "objection"; orderId: string }
  | { action: "code"; result: InboundConfirmResult };

// Détecteurs OUI / NON bilingues (darija AR + FR + EN), insensible à la casse.
const YES_RE = /^(oui|إيه|ايه|اه|نعم|yes|ok)$/i;
const NO_RE = /^(non|لا|لأ|no)$/i;
// Branches d'objection (boutons MSG 4 → texte bilingue, match partiel).
const NOT_AVAIL_RE = /dispo|ماشي اليوم/i;
const MIND_CHANGED_RE = /avis|بدلت/i;
const CHEAPER_RE = /cher|أرخص|رخيص/i;

/**
 * Aiguillage des réponses WhatsApp entrantes du tunnel anti-scam :
 *   - "OUI"  → renvoie MSG 2 (le code) à la commande en attente la plus récente.
 *   - "NON"  → note le refus (V1 : pas d'envoi de branche objection).
 *   - sinon  → délègue à confirmOrderByInboundCode (le body est peut-être le code).
 */
export async function handleInboundReply(
  phone: string,
  body: string
): Promise<InboundReplyResult> {
  const masked = maskFrom(phone);
  const bodyTrim = body.trim();

  // ── OUI → envoyer MSG 2 (le code) ──
  if (YES_RE.test(bodyTrim)) {
    const { orders, dbError } = await findPendingForPhone(phone);
    const order = orders[0];
    if (dbError || !order?.otp_code) {
      console.log(`[whatsapp/inbound] from=${masked} OUI mais aucun order en attente`);
      return { action: "no_pending" };
    }
    const msg = renderTemplateText(TEMPLATES.order_otp_code, [order.otp_code]);
    await sendWhatsAppNotification(phone, msg);
    console.log(`[whatsapp/inbound] from=${masked} OUI → MSG 2 (code) envoyé pour order ${order.id}`);
    return { action: "code_sent", orderId: order.id };
  }

  // ── NON → envoyer MSG 4 (raisons), aucun changement DB ──
  if (NO_RE.test(bodyTrim)) {
    const msg = renderTemplateText(TEMPLATES.order_cancel_reasons, []);
    await sendWhatsAppNotification(phone, msg);
    console.log(`[whatsapp/inbound] from=${masked} NON → MSG 4 (raisons) envoyé`);
    return { action: "declined" };
  }

  // ── Branche A · "Pas dispo" → MSG 5 + decline_reason=not_available (statut inchangé) ──
  if (NOT_AVAIL_RE.test(bodyTrim)) {
    const { orders, dbError } = await findPendingForPhone(phone);
    const order = orders[0];
    if (dbError || !order) {
      console.log(`[whatsapp/inbound] from=${masked} "pas dispo" mais aucun order en attente`);
      return { action: "no_pending" };
    }
    const msg = renderTemplateText(TEMPLATES.order_reschedule_request, []);
    await sendWhatsAppNotification(phone, msg);

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("orders")
      .update({ decline_reason: "not_available", updated_at: nowIso })
      .eq("id", order.id);
    if (updErr) {
      console.error(`[whatsapp/inbound] from=${masked} db-error (decline not_available) order=${order.id}:`, updErr.message);
    }
    console.log(`[whatsapp/inbound] from=${masked} "pas dispo" → MSG 5 + decline_reason=not_available order=${order.id}`);
    return { action: "reschedule", orderId: order.id };
  }

  // ── Branche B · "Changé d'avis" → MSG 6 + status=cancelled + decline_reason=changed_mind ──
  if (MIND_CHANGED_RE.test(bodyTrim)) {
    const { orders, dbError } = await findPendingForPhone(phone);
    const order = orders[0];
    if (dbError || !order) {
      console.log(`[whatsapp/inbound] from=${masked} "changé d'avis" mais aucun order en attente`);
      return { action: "no_pending" };
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // Contexte MSG 6 : boutique (profil vendeur) + prénom (client).
    const { data: vendor } = await supabase
      .from("profiles")
      .select("store_name, full_name, expo_push_token, locale")
      .eq("id", order.user_id)
      .single();
    const boutique = vendor?.store_name ?? vendor?.full_name ?? "votre vendeur";
    const prenom = (enrichedClient(order)?.full_name ?? "").split(" ")[0] ?? "";

    const msg = renderTemplateText(TEMPLATES.order_cancelled_mind_changed, [prenom, boutique]);
    await sendWhatsAppNotification(phone, msg);

    const { error: updErr } = await supabase
      .from("orders")
      .update({ status: "cancelled", decline_reason: "changed_mind", updated_at: nowIso })
      .eq("id", order.id);
    if (updErr) {
      console.error(`[whatsapp/inbound] from=${masked} db-error (cancel changed_mind) order=${order.id}:`, updErr.message);
    }

    if (vendor?.expo_push_token) {
      const { title, body } = orderCancelled(vendor.locale, {
        reference: order.id.slice(0, 8).toUpperCase(),
      });
      const pushResult = await sendExpoPush(
        vendor.expo_push_token,
        title,
        body,
        { orderId: order.id, type: "order_cancelled" }
      );
      if (!pushResult.success) console.error("[whatsapp/inbound] expo push (cancel) failed:", pushResult.error);
    }

    console.log(`[whatsapp/inbound] from=${masked} "changé d'avis" → MSG 6 + cancelled order=${order.id}`);
    return { action: "cancelled_mind", orderId: order.id };
  }

  // ── Branche C · "Moins cher" → MSG 7 + decline_reason=found_cheaper (statut inchangé) ──
  // Le OUI qui suivra retombe sur YES_RE → MSG 2 (code), déjà géré.
  if (CHEAPER_RE.test(bodyTrim)) {
    const { orders, dbError } = await findPendingForPhone(phone);
    const order = orders[0];
    if (dbError || !order) {
      console.log(`[whatsapp/inbound] from=${masked} "moins cher" mais aucun order en attente`);
      return { action: "no_pending" };
    }
    const msg = renderTemplateText(TEMPLATES.order_objection_cheaper, []);
    await sendWhatsAppNotification(phone, msg);

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("orders")
      .update({ decline_reason: "found_cheaper", updated_at: nowIso })
      .eq("id", order.id);
    if (updErr) {
      console.error(`[whatsapp/inbound] from=${masked} db-error (decline found_cheaper) order=${order.id}:`, updErr.message);
    }
    console.log(`[whatsapp/inbound] from=${masked} "moins cher" → MSG 7 + decline_reason=found_cheaper order=${order.id}`);
    return { action: "objection", orderId: order.id };
  }

  // ── Sinon : peut-être le code 6 chiffres → délégation ──
  const result = await confirmOrderByInboundCode(phone, bodyTrim);
  return { action: "code", result };
}
