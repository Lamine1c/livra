import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { CHARGILY_API_BASE, getChargilySecret } from "@/lib/chargily";

// POST /api/billing/checkout — crée un checkout Chargily Pay v2 (MODE TEST)
// pour l'abonnement vendeur : 499 DZD/mois founder, 999 DZD/mois sinon.
// Auth : Bearer JWT Supabase (même pattern que /api/profile/push-token).
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

  // Tarif : 499 DZD founder (founder_index non nul), sinon 999 DZD.
  const amount = vendor.founder_index !== null ? 499 : 999;
  const origin = req.nextUrl.origin;

  const payload: Record<string, unknown> = {
    amount,
    currency: "dzd",
    success_url: `${origin}/billing/success`,
    failure_url: `${origin}/billing/echec`,
    webhook_endpoint: `${origin}/api/billing/webhook`,
    description: `Abonnement LIVRA — 30 jours (${amount} DZD)`,
    metadata: { vendor_id: vendor.id, email: vendor.email },
  };
  if (vendor.chargily_customer_id) {
    payload.customer_id = vendor.chargily_customer_id;
  }

  let checkout: { id?: string; checkout_url?: string; customer_id?: string };
  try {
    const res = await fetch(`${CHARGILY_API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[billing/checkout] Chargily error", res.status, detail);
      return NextResponse.json({ error: "Création du paiement impossible" }, { status: 502 });
    }
    checkout = await res.json();
  } catch (err) {
    console.error("[billing/checkout] Chargily unreachable:", err);
    return NextResponse.json({ error: "Création du paiement impossible" }, { status: 502 });
  }

  if (!checkout.checkout_url) {
    console.error("[billing/checkout] réponse Chargily sans checkout_url:", checkout);
    return NextResponse.json({ error: "Création du paiement impossible" }, { status: 502 });
  }

  // Mémorise l'id client Chargily si l'API le renvoie (facilite les paiements suivants).
  if (checkout.customer_id && checkout.customer_id !== vendor.chargily_customer_id) {
    const { error: updateError } = await supabase
      .from("vendors_waitlist")
      .update({ chargily_customer_id: checkout.customer_id })
      .eq("id", vendor.id);
    if (updateError) {
      // Non bloquant : le checkout existe, on log seulement.
      console.error("[billing/checkout] chargily_customer_id update failed:", updateError);
    }
  }

  return NextResponse.json({ checkout_url: checkout.checkout_url });
}
