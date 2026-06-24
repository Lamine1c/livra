import { Order } from "@/types";

// ─── ECOTRACK (famille : DHD, Anderson, …) ────────────────────
// UNE lib paramétrée par slug → baseUrl. Auth = un seul header Bearer.
// Doc officielle : https://documenter.getpostman.com/view/14517169/Tz5je15g
// ⚠️ Bases vérifiées au curl : dhd.ecotrack.dz fait un 301 → platform.dhd-dz.com
//   (DHD a migré sur son propre host, toujours propulsé par Ecotrack). On pointe
//   l'host final directement : un POST qui suit un 301 perdrait son body.
export const ECOTRACK_SLUG_BASE_URL: Record<string, string> = {
  dhd: "https://platform.dhd-dz.com",
  anderson: "https://anderson-ecommerce.ecotrack.dz",
};

// ─── STATUS MAPPING ───────────────────────────────────────────
// Vérifié au curl réel (Anderson) : le statut est un CODE snake_case dans
// activity[].status (PAS un libellé FR). Libellé inconnu → garde le statut
// courant (pas de régression, cf. STATUS_RANK). Une clé qui ne matche pas est inerte.
export const ECOTRACK_STATUS_MAP: Record<string, string> = {
  // ✅ Confirmé au curl (état initial à la création du bon) :
  order_information_received_by_carrier: "shipped",
  // Plausibles (codes standard famille Ecotrack) — à valider sur de vraies livraisons :
  order_accepted_by_carrier: "shipped",
  picked_up_by_carrier: "shipped",
  in_preparation: "shipped",
  in_transit: "shipped",
  dispatched: "shipped",
  out_for_delivery: "shipped",
  delivered: "delivered",
  returned: "returned",
  returned_to_sender: "returned",
  return_received_by_seller: "returned",
  cancelled: "cancelled",
  canceled: "cancelled",
};

export const STATUS_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 5,
  returned: 5,
};

// ─── TYPES ────────────────────────────────────────────────────
export interface EcotrackParcelResult {
  tracking: string;
}

export interface EcotrackParcelStatus {
  tracking: string;
  last_status: string;
}

// ─── HELPERS ──────────────────────────────────────────────────
function ecotrackBase(slug: string): string {
  const base = ECOTRACK_SLUG_BASE_URL[slug];
  if (!base) throw new Error(`Transporteur Ecotrack inconnu : ${slug}`);
  return base.replace(/\/$/, "");
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function buildProductList(items: Order["items"]): string {
  if (!items?.length) return "Colis";
  return items.map((i) => `${i.product_name} x${i.quantity}`).join(", ");
}

function totalQuantity(items: Order["items"]): number {
  if (!items?.length) return 1;
  return items.reduce((s, i) => s + (i.quantity || 0), 0) || 1;
}

// ─── TEST TOKEN ───────────────────────────────────────────────
// GET /api/v1/validate/token?api_token=<token>
//   → { success, message: VALID_TOKEN | INVALID_TOKEN | TOKEN_NOT_ALLOWED }
export async function testEcotrackToken(
  slug: string,
  token: string
): Promise<{ ok: boolean; message: string }> {
  const base = ecotrackBase(slug);
  const res = await fetch(
    `${base}/api/v1/validate/token?api_token=${encodeURIComponent(token)}`,
    { method: "GET", headers: authHeaders(token) }
  );

  const data = await res.json().catch(() => null);
  console.log(`[Ecotrack validate/token ${slug}]`, { status: res.status, body: data });

  // Vérifié au curl : un token invalide est rejeté par le middleware Bearer en 401
  // (corps {"message":"Unauthenticated."}), et non par un 200 + message INVALID_TOKEN.
  if (res.status === 401 || res.status === 403) {
    return { ok: false, message: "Token invalide ou accès API non autorisé." };
  }
  if (!res.ok) {
    return { ok: false, message: `Erreur ${slug} (${res.status}).` };
  }
  const message = (data as { message?: string } | null)?.message ?? "";
  if (message === "VALID_TOKEN") return { ok: true, message };
  if (message === "TOKEN_NOT_ALLOWED") {
    return { ok: false, message: "Accès API désactivé sur ce compte Ecotrack." };
  }
  return { ok: false, message: "Token Ecotrack invalide." };
}

// ─── CREATE ORDER ─────────────────────────────────────────────
// POST /api/v1/create/order — succès = success !== false.
export async function createEcotrackOrder(
  slug: string,
  order: Order,
  token: string,
  opts?: { stopDesk?: boolean }
): Promise<EcotrackParcelResult> {
  if (!order.client) throw new Error("Données client manquantes.");

  const codeWilaya = Number(order.client.wilaya);
  if (!codeWilaya || Number.isNaN(codeWilaya)) {
    throw new Error("Wilaya du client invalide (code_wilaya requis).");
  }

  const base = ecotrackBase(slug);
  const payload = {
    reference: order.reference,
    nom_client: order.client.full_name,
    telephone: order.client.phone,
    telephone_2: "",
    adresse: order.client.address, // vraie adresse client (le mobile la garantit non vide en mode Domicile)
    code_postal: "",
    commune: order.client.commune,
    code_wilaya: codeWilaya,
    montant: order.total_amount,
    remarque: "",
    produit: buildProductList(order.items),
    stock: 0,
    quantite: totalQuantity(order.items),
    boutique: "",
    type: 1, // 1 = Livraison
    stop_desk: opts?.stopDesk ? 1 : 0,
  };

  const res = await fetch(`${base}/api/v1/create/order`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);
  console.log(`[Ecotrack create/order ${slug}]`, { status: res.status, body: data });

  if (!res.ok) {
    const msg = (data as { message?: string } | null)?.message;
    throw new Error(msg || `Erreur ${slug} (${res.status}).`);
  }

  const d = data as { success?: boolean; message?: string; tracking?: string } | null;
  if (d?.success === false) {
    throw new Error(d.message || "Création de la commande Ecotrack échouée.");
  }

  // ✅ Confirmé au curl réel : réponse = {"success":true,"tracking":"EC…","reference":"…"}.
  const tracking = d?.tracking;
  if (!tracking) throw new Error("Numéro de tracking absent de la réponse Ecotrack.");
  return { tracking };
}

// ─── FETCH STATUS ─────────────────────────────────────────────
// ✅ Confirmé au curl réel (Anderson) :
//   GET /api/v1/get/tracking/info?tracking=<id> → { recipientName, activity:[
//     { date, time, status, station } ], ... }. Le statut courant = le code
//   (snake_case) de la DERNIÈRE entrée de activity[].
export async function fetchEcotrackStatus(
  slug: string,
  tracking: string,
  token: string
): Promise<EcotrackParcelStatus | null> {
  const base = ecotrackBase(slug);
  try {
    const res = await fetch(
      `${base}/api/v1/get/tracking/info?tracking=${encodeURIComponent(tracking)}`,
      { method: "GET", headers: authHeaders(token) }
    );
    if (!res.ok) {
      console.warn(`[Ecotrack status ${slug}] ${tracking} → ${res.status}`);
      return null;
    }
    const data = await res.json().catch(() => null);
    const activity = (data as { activity?: Array<{ status?: string }> } | null)?.activity;
    const last = activity?.length ? (activity[activity.length - 1]?.status ?? "") : "";
    if (!last) return null;
    return { tracking, last_status: last };
  } catch (err) {
    console.warn(`[Ecotrack status ${slug}] ${tracking} → erreur réseau`, err);
    return null;
  }
}
