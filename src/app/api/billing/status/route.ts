import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/billing/status — statut d'abonnement du vendeur authentifié.
// Auth : Bearer JWT Supabase (même pattern que /api/billing/checkout).
export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user || !user.email) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors_waitlist")
    .select("subscription_status, paid_until, founder_index")
    .eq("email", user.email)
    .maybeSingle();

  if (vendorError) {
    console.error("[billing/status] vendor lookup failed:", vendorError);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    subscription_status: vendor.subscription_status,
    paid_until: vendor.paid_until,
    founder_index: vendor.founder_index,
  });
}
