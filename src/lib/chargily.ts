// Chargily Pay v2 — MODE TEST.
// Doc : https://dev.chargily.com/pay-v2/api-reference/introduction
//   Test : https://pay.chargily.net/test/api/v2
//   Live : https://pay.chargily.net/api/v2 (bascule = changer URL + clés)
// Auth : Authorization: Bearer <CHARGILY_SECRET> (clé secrète, Developers Corner).
// Webhook : header `signature` = HMAC-SHA256 hex du corps BRUT, clé = CHARGILY_SECRET.
export const CHARGILY_API_BASE = "https://pay.chargily.net/test/api/v2";

// Clés lues au runtime uniquement (jamais au module level — cf. CLAUDE.md).
// CHARGILY_SECRET  : clé secrète (Bearer + HMAC webhook) — OBLIGATOIRE.
// CHARGILY_API_KEY : clé publique (non utilisée côté serveur pour l'instant).
export function getChargilySecret(): string | null {
  const secret = process.env.CHARGILY_SECRET;
  return secret && secret.trim() !== "" ? secret : null;
}

// ── Création d'un checkout abonnement vendeur ──
// Partagé entre POST /api/billing/checkout (mobile, Bearer) et
// /billing/activer (email de rappel, token HMAC). Tarif : 499 DZD founder
// (founder_index non nul), sinon 999 DZD.

export interface VendorForCheckout {
  id: string;
  email: string;
  founder_index: number | null;
  chargily_customer_id: string | null;
}

export type VendorCheckoutResult =
  | { ok: true; checkout_url: string; customer_id: string | null }
  | { ok: false; error: string };

export function vendorAmount(vendor: Pick<VendorForCheckout, "founder_index">): 499 | 999 {
  return vendor.founder_index !== null ? 499 : 999;
}

export async function createVendorCheckout(
  vendor: VendorForCheckout,
  origin: string,
  secret: string
): Promise<VendorCheckoutResult> {
  const amount = vendorAmount(vendor);

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
      console.error("[chargily] checkout error", res.status, detail);
      return { ok: false, error: "Création du paiement impossible" };
    }
    checkout = await res.json();
  } catch (err) {
    console.error("[chargily] unreachable:", err);
    return { ok: false, error: "Création du paiement impossible" };
  }

  if (!checkout.checkout_url) {
    console.error("[chargily] réponse sans checkout_url:", checkout);
    return { ok: false, error: "Création du paiement impossible" };
  }

  return { ok: true, checkout_url: checkout.checkout_url, customer_id: checkout.customer_id ?? null };
}
