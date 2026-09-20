import { createServiceClient } from "@/lib/supabase/service";
import { TEMPLATES } from "@/lib/whatsapp-templates";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

// ─── [N36W] Rattrapage de vente — envoi de l'offre winback ────────────────────
// Envoie le template Meta APPROUVÉ `order_winback_offer` à un acheteur ayant refusé de façon
// RÉCUPÉRABLE (branche A `not_available` / C `found_cheaper`), à partir de la réponse préparée
// ACTIVE du vendeur (table prepared_responses, migration 045).
//
// 🔴 GATE DUR : rien ne part tant que `WINBACK_SEND_READY !== "true"` (défaut absent = false).
// 🔴 AUCUN appel automatique n'est branché ici : cette fonction EXISTE mais rien ne l'appelle encore
//    (le déclencheur — après combien de temps, sur quel motif — sera un lot ultérieur décidé par Lamine).
// Idempotence DURE : `orders.winback_sent_at` est CLAIMÉ avant l'envoi (UPDATE conditionnel) → jamais 2 envois.
// Dégradation propre si la migration 045 n'est pas appliquée (table/colonne absente → skip, pas de crash).

const ABSENT_RE = /42P01|PGRST205|42703|does not exist|Could not find/i;
function isAbsent(e: { code?: string; message?: string } | null): boolean {
  return !!e && ABSENT_RE.test(`${e.code ?? ""} ${e.message ?? ""}`);
}

// Date en DD-MM-YYYY au fuseau Algérie (UTC+1, pas de DST).
function formatDzDate(ms: number): string {
  const d = new Date(ms + 60 * 60 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

// Choix de langue de la variante Meta selon la locale ACHETEUR. Aujourd'hui `clients` n'a PAS de
// colonne locale (cf. 001_initial_schema) → la locale acheteur est INCONNUE → fr par défaut. Le jour
// où un signal de locale acheteur existe, passer sa valeur ici active la variante ar approuvée.
function pickLang(buyerLocale: string | null | undefined): "fr" | "ar" {
  return buyerLocale === "ar" ? "ar" : "fr";
}

type WinbackResult = { sent: boolean; skipped?: string; error?: string };

export async function sendWinbackOffer(orderId: string): Promise<WinbackResult> {
  if (process.env.WINBACK_SEND_READY !== "true") return { sent: false, skipped: "disabled" };

  const supabase = createServiceClient();

  // Order + acheteur + motif de refus + garde d'idempotence.
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, user_id, decline_reason, winback_sent_at, client:clients(full_name, phone)")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr) {
    if (isAbsent(orderErr)) return { sent: false, skipped: "migration_045_absent" };
    console.error("[winback] lecture order échouée:", orderErr.message);
    return { sent: false, error: orderErr.message };
  }
  if (!order) return { sent: false, skipped: "order_introuvable" };
  if (order.winback_sent_at) return { sent: false, skipped: "already_sent" };

  const reason = order.decline_reason as string | null;
  if (reason !== "not_available" && reason !== "found_cheaper") {
    return { sent: false, skipped: "reason_non_recuperable" };
  }

  const client = (Array.isArray(order.client) ? order.client[0] : order.client) as
    | { full_name?: string; phone?: string }
    | null;
  if (!client?.phone) return { sent: false, skipped: "pas_de_phone" };

  // Réponse préparée ACTIVE du vendeur pour ce motif.
  const { data: pr, error: prErr } = await supabase
    .from("prepared_responses")
    .select("body, discount_rate, validity_days")
    .eq("user_id", order.user_id)
    .eq("trigger_reason", reason)
    .eq("active", true)
    .maybeSingle();

  if (prErr) {
    if (isAbsent(prErr)) return { sent: false, skipped: "migration_045_absent" };
    console.error("[winback] lecture prepared_responses échouée:", prErr.message);
    return { sent: false, error: prErr.message };
  }
  if (!pr) return { sent: false, skipped: "aucune_reponse_preparee" };

  // Offre = remise (prioritaire) sinon texte libre. Rien d'exploitable → on n'envoie pas.
  const offre = pr.discount_rate != null ? `-${pr.discount_rate}%` : (pr.body ?? "").trim();
  if (!offre) return { sent: false, skipped: "offre_vide" };

  // Date limite = maintenant + validity_days (défaut 3 j si non renseigné), DD-MM-YYYY (DZ).
  const dateLimite = formatDzDate(Date.now() + (pr.validity_days ?? 3) * 24 * 60 * 60 * 1000);

  const { data: vendor } = await supabase
    .from("profiles")
    .select("store_name, full_name")
    .eq("id", order.user_id)
    .maybeSingle();
  const boutique = vendor?.store_name ?? vendor?.full_name ?? "votre vendeur";
  const prenom = (client.full_name ?? "").split(" ")[0] ?? "";

  // Idempotence DURE : CLAIM winback_sent_at AVANT l'envoi (UPDATE ... WHERE winback_sent_at IS NULL).
  // 0 ligne mise à jour = un autre appel a déjà claimé → skip (jamais 2 envois). Un envoi raté APRÈS
  // le claim ne sera PAS re-tenté (best-effort assumé, anti-spam MARKETING).
  const nowIso = new Date().toISOString();
  const { data: claimed, error: claimErr } = await supabase
    .from("orders")
    .update({ winback_sent_at: nowIso })
    .eq("id", orderId)
    .is("winback_sent_at", null)
    .select("id");

  if (claimErr) {
    if (isAbsent(claimErr)) return { sent: false, skipped: "migration_045_absent" };
    console.error("[winback] claim winback_sent_at échoué:", claimErr.message);
    return { sent: false, error: claimErr.message };
  }
  if (!claimed || claimed.length === 0) return { sent: false, skipped: "already_sent" };

  const template = { ...TEMPLATES.order_winback_offer, language: pickLang(null) };
  const r = await sendWhatsAppTemplate(client.phone, template, [prenom, boutique, offre, dateLimite]);
  if (!r.success) {
    console.error(`[winback] envoi order_winback_offer échec order=${orderId}:`, r.error);
    return { sent: false, error: r.error };
  }
  return { sent: true };
}
