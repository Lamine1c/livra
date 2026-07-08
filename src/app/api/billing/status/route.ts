import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/billing/status — statut d'abonnement du vendeur authentifié.
// Auth : Bearer JWT Supabase (même pattern que /api/billing/checkout).
//
// CONTRAT (consommé tel quel par le mobile — ne pas dévier) :
// 200 {
//   status: "trial" | "active" | "expired" | "comped",
//   days_left: number | null,   // jours ENTIERS restants (trial: vs trial_ends_at, active: vs paid_until, sinon null)
//   amount: 499 | 999,          // DZD/mois (499 founder, 999 sinon)
//   checkout_url_endpoint: "/api/billing/checkout"
// }
// Trial échu → renvoie "expired" ET le persiste (subscription_status='expired').

type BillingStatus = "trial" | "active" | "expired" | "comped";

function wholeDaysLeft(until: string | null): number | null {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user || !user.email) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors_waitlist")
    .select("id, subscription_status, paid_until, trial_ends_at, founder_index")
    .eq("email", user.email)
    .maybeSingle();

  if (vendorError) {
    console.error("[billing/status] vendor lookup failed:", vendorError);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
  }

  let status = (vendor.subscription_status ?? "trial") as BillingStatus;

  // Trial échu → 'expired', persisté immédiatement (idempotent).
  if (
    status === "trial" &&
    vendor.trial_ends_at &&
    new Date(vendor.trial_ends_at).getTime() <= Date.now()
  ) {
    status = "expired";
    const { error: updateError } = await supabase
      .from("vendors_waitlist")
      .update({ subscription_status: "expired" })
      .eq("id", vendor.id);
    if (updateError) {
      console.error("[billing/status] persist expired failed:", updateError);
    }
  }

  let days_left: number | null = null;
  if (status === "trial") {
    days_left = wholeDaysLeft(vendor.trial_ends_at);
  } else if (status === "active") {
    days_left = wholeDaysLeft(vendor.paid_until);
  }

  return NextResponse.json({
    status,
    days_left,
    amount: vendor.founder_index !== null ? 499 : 999,
    checkout_url_endpoint: "/api/billing/checkout",
  });
}
