import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePhoneNumber, sendWhatsAppNotification, isOutOfWindow } from "@/lib/whatsapp";
import { sendExpoPushToOwner } from "@/lib/expo-push";
import { winbackAccepted, winbackAcceptedLate, winbackDeclined, slotChosen, contactRequested, winbackExpired } from "@/lib/push-messages";
import { sendOrderConfirmationOtp } from "@/lib/send-order-otp";
import {
  TEMPLATES,
  renderTemplateText,
  WINBACK_YES_PAYLOAD,
  WINBACK_NO_PAYLOAD,
  SLOT_TOMORROW_PAYLOAD,
  SLOT_DAY_AFTER_PAYLOAD,
  SLOT_CONTACT_PAYLOAD,
} from "@/lib/whatsapp-templates";

// [G3W] Statuts où la commande n'est PAS encore partie chez le transporteur → seule fenêtre où l'on
// peut modifier le COD sans créer d'écart avec le montant annoncé à Yalidine/Ecotrack (shipped+).
const PRE_SHIP_STATUSES = ["pending", "pending_confirmation", "confirmed", "processing"];

// ─── [N50W] Retour ACHETEUR après relance → notif vendeur + issue de la boucle ─────────────
// Ferme la boucle du flow de refus (N45W/N49W) : la relance vendeur (order_winback_offer OU les 3
// créneaux order_reschedule_slots) a posé `orders.winback_sent_at`. La réponse de l'acheteur aux
// boutons (WINBACK_* / SLOT_*) est routée ICI, AVANT le tunnel OUI/NON classique.
//
// Issue (décision Lamine) :
//  - WINBACK_YES / SLOT_TOMORROW / SLOT_DAY_AFTER → la commande REPART : on efface `decline_reason`
//    (statut INTACT → plus de marqueur de refus, la vente reprend).
//  - WINBACK_NO → 2e refus → ANNULATION (`status='cancelled'`).
//  - SLOT_CONTACT (« Contactez la boutique ») → notif vendeur, commande EN ATTENTE (aucun changement d'état).
// Dans TOUS les cas : push vendeur avec `orderId` dans le payload (le mobile route par orderId seul).
//
// BORNE « 1 relance / commande » = le champ EXISTANT `winback_sent_at` (posé à la relance, JAMAIS remis à
// null ici) → l'endpoint de décision (N49W) renverra `already_sent` sur toute 2e tentative. Zéro nouveau champ.
//
// STOP-check (aucun cron/RLS/billing ne dépend de l'état remis) : `decline_reason` n'est lu QUE par
// buyer-score (compte les refus) et Trust Layer (`OR decline_reason not null`) — l'effacer DÉ-compte le
// refus, ce qui est CORRECT (la vente n'est plus perdue). `status='cancelled'` = le chemin d'annulation
// normal, déjà géré partout. Aucun cron (yalidine-poll=shipped, billing=subscription) ni RLS ni
// `vendor_subscription_allows_orders` ne dépend de ces champs pour ce flow. (Même analyse qu'au N45W.)

const REFUSAL_PAYLOADS = new Set<string>([
  WINBACK_YES_PAYLOAD,
  WINBACK_NO_PAYLOAD,
  SLOT_TOMORROW_PAYLOAD,
  SLOT_DAY_AFTER_PAYLOAD,
  SLOT_CONTACT_PAYLOAD,
]);

export function isRefusalReplyPayload(payload: string | null | undefined): boolean {
  return payload != null && REFUSAL_PAYLOADS.has(payload);
}

// [T3-3] Date calendaire ALGER (UTC+1, pas de DST) à J+days, au format ISO YYYY-MM-DD (colonne `date`).
// Même convention de fuseau que les autres agrégats du repo (décalage +1h puis Date.UTC).
function algDatePlusDays(days: number): string {
  const alg = new Date(Date.now() + 60 * 60 * 1000);
  const ms = Date.UTC(alg.getUTCFullYear(), alg.getUTCMonth(), alg.getUTCDate()) + days * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

// Toujours "consommé" (return, jamais de fall-through vers le tunnel) : ces payloads n'ont de sens que
// pour la boucle de refus. Best-effort : ne throw jamais (l'appelant est le webhook, hors chemin critique).
export async function handleRefusalReply(
  supabase: SupabaseClient,
  fromPhone: string,
  payload: string
): Promise<void> {
  try {
    const norm = normalizePhoneNumber(fromPhone);
    const { data: clientRows } = await supabase.from("clients").select("id").eq("phone_normalized", norm);
    const clientIds = (clientRows ?? []).map((c) => c.id as string);
    if (clientIds.length === 0) {
      console.log(`[whatsapp/inbound] refusal_reply ${payload} sans client connu → ignoré`);
      return;
    }

    // La commande RELANCÉE (winback_sent_at posé) la plus récente de ce numéro.
    const { data: order } = await supabase
      .from("orders")
      .select("id, reference, user_id, decline_reason, status, total_amount, delivery_fee, winback_discount_rate, original_total_amount, client:clients(full_name, phone)")
      .in("client_id", clientIds)
      .not("winback_sent_at", "is", null)
      .order("winback_sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!order) {
      console.log(`[whatsapp/inbound] refusal_reply ${payload} sans commande relancée → ignoré`);
      return;
    }

    const orderId = order.id as string;
    const reference = (order.reference as string | null) ?? orderId.slice(0, 8).toUpperCase();
    const nowIso = new Date().toISOString();

    const { data: vendor } = await supabase
      .from("profiles")
      .select("locale, expo_push_token, store_name, full_name")
      .eq("id", order.user_id)
      .maybeSingle();
    const locale = (vendor?.locale as string | null) ?? null;

    // [T0D-3] Échéance de l'offre winback (colonne 056). Lecture SÉPARÉE et TOLÉRANTE : on ne l'ajoute
    // PAS au SELECT principal (:71) pour ne pas le casser tant que 056 n'est pas appliquée. Si la colonne
    // manque, la requête échoue silencieusement → winbackExpiresAt=null → aucun « oui » n'est refusé
    // (comportement actuel, zéro régression).
    const { data: expRow } = await supabase.from("orders").select("winback_expires_at").eq("id", orderId).maybeSingle();
    const winbackExpiresAt = (expRow as { winback_expires_at?: string | null } | null)?.winback_expires_at ?? null;

    let msg: { title: string; body: string };
    let outcome: string;
    // [T1-3] Déclenche l'auto-envoi de l'OTP de confirmation (MSG 1) uniquement sur un winback ACCEPTÉ
    // et commande NON expédiée (remise appliquée OU pas de changement de prix). Reste false sinon.
    let autoSendOtp = false;
    // [T3-3] Créneau choisi par l'acheteur « pas dispo » à persister sur la commande. null = aucun choix.
    let availability: { choice: "tomorrow" | "day_after" | "contact"; date: string | null } | null = null;

    if (payload === WINBACK_YES_PAYLOAD) {
      // [G3W] L'acheteur ACCEPTE l'offre → appliquer la remise GELÉE (winback_discount_rate) au COD,
      // BORNÉ aux statuts pré-expédition (sinon écart avec le montant déjà annoncé au transporteur).
      const rate = order.winback_discount_rate as number | null;
      const status = order.status as string | null;
      const total = Number(order.total_amount ?? 0);
      // [T0C-4] total_amount = frais INCLUS. La remise porte sur le SOUS-TOTAL PRODUITS, jamais sur
      // les frais de livraison : nouveau = round((total − fee) × (1 − r/100)) + fee.
      const fee = Number(order.delivery_fee ?? 0);
      const alreadyApplied = order.original_total_amount != null;
      // [T0D-3] « oui » APRÈS l'échéance de l'offre = PAS de remise (l'acheteur l'a ratée).
      const expired = !!winbackExpiresAt && Date.now() > new Date(winbackExpiresAt).getTime();
      let applied = false;
      let appliedDiscounted = 0;
      let expiredHandled = false;

      if (rate != null && !alreadyApplied && status != null && PRE_SHIP_STATUSES.includes(status)) {
        if (expired) {
          // [T0D-3] Offre expirée : aucune remise, la commande reste EN L'ÉTAT (ni annulée ni reprise,
          // decline_reason inchangé). L'acheteur reçoit un texte libre clair (fenêtre ouverte par son
          // tap) ; le vendeur est notifié (msg winbackExpired, push plus bas). Hors fenêtre → rien.
          expiredHandled = true;
          const client = (Array.isArray(order.client) ? order.client[0] : order.client) as { full_name?: string; phone?: string } | null;
          if (client?.phone) {
            const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
            const boutique = (vendor?.store_name as string | null) ?? (vendor?.full_name as string | null) ?? "votre vendeur";
            const er = await sendWhatsAppNotification(
              client.phone,
              renderTemplateText(TEMPLATES.order_winback_expired, [prenom, boutique])
            );
            if (!er.success && !isOutOfWindow(er.code)) console.error("[refusal-reply] msg offre expirée échec:", er.error);
          }
        } else {
          const discounted = Math.max(0, Math.round((total - fee) * (1 - rate / 100))) + fee;
          // UPDATE atomique + BORNÉ : garde le COD d'origine (historique), applique le remisé, efface le
          // refus. Le WHERE (statut pré-expédition + original_total_amount IS NULL) = idempotence + garde
          // « jamais de remise après départ transporteur ».
          const { data: rows } = await supabase
            .from("orders")
            .update({ original_total_amount: total, total_amount: discounted, decline_reason: null, updated_at: nowIso })
            .eq("id", orderId)
            .is("original_total_amount", null)
            .in("status", PRE_SHIP_STATUSES)
            .select("id");
          applied = !!rows && rows.length > 0;

          if (applied) {
            appliedDiscounted = discounted;
            // Prévenir l'ACHETEUR du NOUVEAU prix (session, fenêtre ouverte par son « Oui ») — texte libre,
            // même patron que order_decision_pending. Hors fenêtre → rien (défensif), sinon loggé.
            const client = (Array.isArray(order.client) ? order.client[0] : order.client) as { full_name?: string; phone?: string } | null;
            if (client?.phone) {
              const prenom = (client.full_name ?? "").split(" ")[0] ?? "";
              const boutique = (vendor?.store_name as string | null) ?? (vendor?.full_name as string | null) ?? "votre vendeur";
              const priceTxt = new Intl.NumberFormat("en-US").format(discounted);
              const pr = await sendWhatsAppNotification(
                client.phone,
                renderTemplateText(TEMPLATES.order_price_updated, [prenom, boutique, priceTxt])
              );
              if (!pr.success && !isOutOfWindow(pr.code)) console.error("[refusal-reply] msg nouveau prix échec:", pr.error);
            }
          }
        }
      }

      if (expiredHandled) {
        msg = winbackExpired(locale, { reference });
        outcome = "winback_yes_expired";
      } else if (applied) {
        msg = winbackAccepted(locale, { reference });
        outcome = `winback_accepted_discount_${rate}_total_${appliedDiscounted}`;
        autoSendOtp = true; // remise appliquée, pré-expédition par construction → on confirme direct
      } else {
        // Commande déjà partie (shipped+) OU déjà appliquée OU pas de taux gelé : la vente reprend
        // (on efface le refus) MAIS on NE TOUCHE PAS au COD. Le vendeur est prévenu de régulariser
        // (sinon écart COD annoncé/encaissé). On ne réécrase pas total_amount.
        await supabase.from("orders").update({ decline_reason: null, updated_at: nowIso }).eq("id", orderId);
        const shipped = status != null && !PRE_SHIP_STATUSES.includes(status);
        msg = shipped ? winbackAcceptedLate(locale, { reference }) : winbackAccepted(locale, { reference });
        outcome = shipped ? "winback_accepted_shipped_no_discount" : "winback_accepted_no_price_change";
        autoSendOtp = !shipped; // non expédiée → la vente reprend, on confirme ; shipped → surtout pas
      }
    } else if (payload === SLOT_TOMORROW_PAYLOAD || payload === SLOT_DAY_AFTER_PAYLOAD) {
      // Créneau choisi (pas de remise) : la commande REPART, efface le refus (statut intact).
      await supabase.from("orders").update({ decline_reason: null, updated_at: nowIso }).eq("id", orderId);
      const slot = payload === SLOT_TOMORROW_PAYLOAD ? "tomorrow" : "day_after";
      // [T3-3] Mémorise le créneau + la date réelle (Alger) → le vendeur le retrouve sur la commande.
      availability = { choice: slot, date: algDatePlusDays(slot === "tomorrow" ? 1 : 2) };
      msg = slotChosen(locale, { reference, slot });
      outcome = `slot_${slot}`;
    } else if (payload === WINBACK_NO_PAYLOAD) {
      // 2e refus → ANNULATION.
      await supabase.from("orders").update({ status: "cancelled", updated_at: nowIso }).eq("id", orderId);
      msg = winbackDeclined(locale, { reference });
      outcome = "winback_declined_cancelled";
    } else {
      // SLOT_CONTACT : commande EN ATTENTE, pas d'annulation, decline_reason inchangé.
      // [T3-3] Mémorise le choix « contacter la boutique » (aucune date).
      availability = { choice: "contact", date: null };
      msg = contactRequested(locale, { reference });
      outcome = "contact_requested";
    }

    // [T3-3] Persiste le créneau acheteur (colonnes migration 057, NON appliquée) : écriture SÉPARÉE et
    // TOLÉRANTE comme winback_expires_at (T0D-3) — colonne absente → erreur ignorée, zéro régression ;
    // le reste du flow (decline_reason/statut/push) a déjà été persisté au-dessus.
    if (availability) {
      const { error: availErr } = await supabase
        .from("orders")
        .update({ buyer_availability_choice: availability.choice, buyer_availability_date: availability.date })
        .eq("id", orderId);
      if (availErr) {
        console.warn(`[refusal-reply] buyer_availability non écrit (migration 057 non appliquée ?) order=${orderId}:`, availErr.message);
      }
    }

    // [T2-4] Garde legacy retirée (bloc scopé) : multi-device tenté même si la colonne est NULL.
    {
      const r = await sendExpoPushToOwner(
        { type: "profile", id: order.user_id as string, fallbackToken: (vendor?.expo_push_token as string | null | undefined) ?? null },
        msg.title,
        msg.body,
        { orderId, type: "refusal_reply" }
      );
      if (!r.success) console.error("[refusal-reply] push vendeur échec:", r.error);
    }

    // [T1-3] Le « oui » à l'offre DÉCLENCHE l'OTP de confirmation (MSG 1) avec le total_amount COURANT,
    // au lieu que le vendeur retape « Envoyer la demande » (qui renvoyait l'ANCIEN prix). Le helper pose
    // otp_sent_at → le mobile sait « code déjà envoyé » et masque le bouton d'envoi. Best-effort : un
    // échec d'envoi ne casse PAS la reprise de la vente déjà persistée (remise/decline_reason).
    if (autoSendOtp) {
      const otpRes = await sendOrderConfirmationOtp(supabase, orderId);
      if (!otpRes.ok) console.error(`[refusal-reply] auto-envoi OTP échec order=${orderId}:`, otpRes.error);
    }

    console.log(`[whatsapp/inbound] refusal_reply outcome=${outcome} order=${orderId}`);
  } catch (e) {
    console.error("[refusal-reply] exception (best-effort, ignorée):", e);
  }
}
