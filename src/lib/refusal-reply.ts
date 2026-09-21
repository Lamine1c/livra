import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePhoneNumber } from "@/lib/whatsapp";
import { sendExpoPushToOwner } from "@/lib/expo-push";
import { winbackAccepted, winbackDeclined, slotChosen, contactRequested } from "@/lib/push-messages";
import {
  WINBACK_YES_PAYLOAD,
  WINBACK_NO_PAYLOAD,
  SLOT_TOMORROW_PAYLOAD,
  SLOT_DAY_AFTER_PAYLOAD,
  SLOT_CONTACT_PAYLOAD,
} from "@/lib/whatsapp-templates";

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
      .select("id, reference, user_id, decline_reason")
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
      .select("locale, expo_push_token")
      .eq("id", order.user_id)
      .maybeSingle();
    const locale = (vendor?.locale as string | null) ?? null;

    let msg: { title: string; body: string };
    let outcome: string;

    if (payload === WINBACK_YES_PAYLOAD || payload === SLOT_TOMORROW_PAYLOAD || payload === SLOT_DAY_AFTER_PAYLOAD) {
      // La commande REPART : efface le marqueur de refus (statut intact).
      await supabase.from("orders").update({ decline_reason: null, updated_at: nowIso }).eq("id", orderId);
      if (payload === WINBACK_YES_PAYLOAD) {
        msg = winbackAccepted(locale, { reference });
        outcome = "winback_accepted";
      } else {
        const slot = payload === SLOT_TOMORROW_PAYLOAD ? "tomorrow" : "day_after";
        msg = slotChosen(locale, { reference, slot });
        outcome = `slot_${slot}`;
      }
    } else if (payload === WINBACK_NO_PAYLOAD) {
      // 2e refus → ANNULATION.
      await supabase.from("orders").update({ status: "cancelled", updated_at: nowIso }).eq("id", orderId);
      msg = winbackDeclined(locale, { reference });
      outcome = "winback_declined_cancelled";
    } else {
      // SLOT_CONTACT : commande EN ATTENTE, pas d'annulation, decline_reason inchangé.
      msg = contactRequested(locale, { reference });
      outcome = "contact_requested";
    }

    if (vendor?.expo_push_token) {
      const r = await sendExpoPushToOwner(
        { type: "profile", id: order.user_id as string, fallbackToken: vendor.expo_push_token as string },
        msg.title,
        msg.body,
        { orderId, type: "refusal_reply" }
      );
      if (!r.success) console.error("[refusal-reply] push vendeur échec:", r.error);
    }
    console.log(`[whatsapp/inbound] refusal_reply outcome=${outcome} order=${orderId}`);
  } catch (e) {
    console.error("[refusal-reply] exception (best-effort, ignorée):", e);
  }
}
