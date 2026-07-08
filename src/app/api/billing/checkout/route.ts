import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { createVendorCheckout, getChargilySecret } from "@/lib/chargily";

// POST /api/billing/checkout — crée un checkout Chargily Pay v2 (MODE TEST)
// pour l'abonnement vendeur : 499 DZD/mois founder, 999 DZD/mois sinon.
// Auth : Bearer JWT Supabase (même pattern que /api/profile/push-token).
// Logique de création partagée avec /billing/activer (src/lib/chargily.ts).
export async function POST(req: NextRequest) {
  const secret = getChargilySecret();
  if (!secret) {
    // Env CHARGILY_SECRET absente (local/Vercel) → pas de crash, message clair.
    return NextResponse.json({ error: "Paiement non configuré" }, { status: 503 });
  }

  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user || !user.email) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors_waitlist")
    .select("id, email, founder_index, chargily_customer_id")
    .eq("email", user.email)
    .maybeSingle();

  if (vendorError) {
    console.error("[billing/checkout] vendor lookup failed:", vendorError);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
  }

  const result = await createVendorCheckout(vendor, req.nextUrl.origin, secret);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Mémorise l'id client Chargily si l'API le renvoie (facilite les paiements suivants).
  if (result.customer_id && result.customer_id !== vendor.chargily_customer_id) {
    const { error: updateError } = await supabase
      .from("vendors_waitlist")
      .update({ chargily_customer_id: result.customer_id })
      .eq("id", vendor.id);
    if (updateError) {
      // Non bloquant : le checkout existe, on log seulement.
      console.error("[billing/checkout] chargily_customer_id update failed:", updateError);
    }
  }

  return NextResponse.json({ checkout_url: result.checkout_url });
}
