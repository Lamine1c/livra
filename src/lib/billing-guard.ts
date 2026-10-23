import { createServiceClient } from "@/lib/supabase/service";

// Guard serveur d'abonnement vendeur (trial gate).
// Utilisé par les routes qui "consomment" du service (envoi WhatsApp de
// confirmation, confirmation de commande). Lecture/tracking/statuts restent
// ouverts — ne brancher ce guard que sur la création/confirmation.
//
// Verdicts :
//   'trial' en cours, 'active' avec paid_until valide, 'comped' → allowed
//   'expired', 'trial' avec trial_ends_at échu, OU 'active' avec paid_until échu
//   → bloqué (la route répond 403 { error: "SUBSCRIPTION_EXPIRED" }).
// Trial OU abonnement échu détecté ici → PERSISTÉ en 'expired' (même logique que
// /api/billing/status).
// [T0A-2] 'active' n'est plus un blanc-seing : un paiement crédite paid_until
// (webhook, now()+30j), et l'accès n'est maintenu que tant que paid_until > now().
//   ⚠️ EXEMPTION 'active' + paid_until IS NULL : fondateurs / comptes passés à la
//   main / comped historiques. Décision Lamine : on les LAISSE PASSER + log, on ne
//   coupe JAMAIS en silence sur une absence de date. (Requête de comptage au RAPPORT.)
// FAIL-OPEN : vendeur absent de vendors_waitlist ou erreur DB → allowed
// (on ne bloque que les expirations avérées).

export const SUBSCRIPTION_EXPIRED_ERROR = "SUBSCRIPTION_EXPIRED";

export type SubscriptionGate =
  | { allowed: true; status: "trial" | "active" | "comped" | "unknown" }
  | { allowed: false; status: "expired" };

export async function requireActiveSubscription(email: string): Promise<SubscriptionGate> {
  const supabase = createServiceClient();
  const { data: vendor, error } = await supabase
    .from("vendors_waitlist")
    .select("id, subscription_status, trial_ends_at, paid_until")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    // Fail-open : une panne DB ne doit pas bloquer un vendeur légitime.
    console.error("[billing-guard] vendor lookup failed:", error);
    return { allowed: true, status: "unknown" };
  }
  if (!vendor) {
    return { allowed: true, status: "unknown" };
  }

  if (vendor.subscription_status === "expired") {
    return { allowed: false, status: "expired" };
  }

  if (
    vendor.subscription_status === "trial" &&
    vendor.trial_ends_at &&
    new Date(vendor.trial_ends_at).getTime() <= Date.now()
  ) {
    // Trial échu → persiste 'expired' (idempotent, même règle que /api/billing/status).
    const { error: updateError } = await supabase
      .from("vendors_waitlist")
      .update({ subscription_status: "expired" })
      .eq("id", vendor.id);
    if (updateError) {
      console.error("[billing-guard] persist expired failed:", updateError);
    }
    return { allowed: false, status: "expired" };
  }

  if (vendor.subscription_status === "active") {
    // [T0A-2] Abonnement payé échu → persiste 'expired' (même patron que le trial).
    if (vendor.paid_until && new Date(vendor.paid_until).getTime() <= Date.now()) {
      const { error: updateError } = await supabase
        .from("vendors_waitlist")
        .update({ subscription_status: "expired" })
        .eq("id", vendor.id);
      if (updateError) {
        console.error("[billing-guard] persist expired (paid_until) failed:", updateError);
      }
      return { allowed: false, status: "expired" };
    }
    // Exemption : 'active' sans date (fondateur / manuel / comped historique) →
    // jamais couper en silence. On laisse passer et on trace (observabilité).
    if (!vendor.paid_until) {
      console.warn(`[billing-guard] active sans paid_until (fondateur/manuel ?) vendor=${vendor.id} — laissé passer`);
    }
    return { allowed: true, status: "active" };
  }

  if (vendor.subscription_status === "comped") {
    return { allowed: true, status: "comped" };
  }
  return { allowed: true, status: "trial" };
}
