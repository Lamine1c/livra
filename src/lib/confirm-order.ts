import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneNumber } from "@/lib/whatsapp";

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
  return { matched: true, orderId: match.id };
}
