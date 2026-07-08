import { createServiceClient } from "@/lib/supabase/service";

// Guard serveur d'abonnement vendeur (trial gate).
// Utilisé par les routes qui "consomment" du service (envoi WhatsApp de
// confirmation, confirmation de commande). Lecture/tracking/statuts restent
// ouverts — ne brancher ce guard que sur la création/confirmation.
//
// Verdicts :
//   'trial' en cours, 'active', 'comped' → allowed
//   'expired', ou 'trial' avec trial_ends_at échu → bloqué (la route répond
//   403 { error: "SUBSCRIPTION_EXPIRED" }).
// Trial échu détecté ici → PERSISTÉ en 'expired' (même logique que
// /api/billing/status).
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
    .select("id, subscription_status, trial_ends_at")
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

  if (vendor.subscription_status === "active" || vendor.subscription_status === "comped") {
    return { allowed: true, status: vendor.subscription_status };
  }
  return { allowed: true, status: "trial" };
}
