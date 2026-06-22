import { Order } from "@/types";

// ─── PROCOLIS (= ZR Express) ──────────────────────────────────
// Spec vérifiée (source CourierDZ). Auth = 2 headers : token + key.
// Pas de cancelOrder, pas de label (non supportés Procolis).
const PROCOLIS_API = "https://procolis.com/api_v1";

export const ZREXPRESS_TRACKING_URL = "https://zrexpress.com/";

// ─── STATUS MAPPING ───────────────────────────────────────────
// Procolis renvoie un libellé de situation (champ "Situation"/"Statut" du colis).
// Best-effort : les libellés ZR exacts s'affinent au test réel. Tout libellé
// inconnu → on garde le statut courant (pas de régression, cf. STATUS_RANK).
export const PROCOLIS_STATUS_MAP: Record<string, string> = {
  "En préparation": "shipped",
  "Vers Wilaya": "shipped",
  "Reçu à Wilaya": "shipped",
  "Sortie pour livraison": "shipped",
  "En attente du client": "shipped",
  "Expédié": "shipped",
  "Livré": "delivered",
  "Livrée": "delivered",
  "Retour vers Vendeur": "returned",
  "Retourné au vendeur": "returned",
  "Echange échoué": "returned",
  "Annulé": "cancelled",
  "Annulée": "cancelled",
};

// Hiérarchie pour empêcher les régressions de statut (identique à yalidine.ts).
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
export interface ProcolisCredentials {
  token: string;
  key: string;
}

export interface ProcolisParcelResult {
  tracking: string;
}

export interface ProcolisParcelStatus {
  tracking: string;
  last_status: string;
}

// ─── HELPERS ──────────────────────────────────────────────────
function procolisHeaders(creds: ProcolisCredentials): HeadersInit {
  return {
    token: creds.token,
    key: creds.key,
    "Content-Type": "application/json",
  };
}

function buildProductList(items: Order["items"]): string {
  if (!items?.length) return "Colis";
  return items.map((i) => `${i.product_name} x${i.quantity}`).join(", ");
}

// ─── TEST CREDENTIALS (GET /token) ────────────────────────────
// 200 + {"Statut":"Accès activé"} = OK ; 401 = invalide.
export async function testProcolisCredentials(
  creds: ProcolisCredentials
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${PROCOLIS_API}/token`, {
    method: "GET",
    headers: procolisHeaders(creds),
  });

  const data = await res.json().catch(() => null);
  console.log("[Procolis /token]", { status: res.status, body: data });

  if (res.status === 401) {
    return { ok: false, message: "Identifiants ZR Express invalides." };
  }
  if (!res.ok) {
    return { ok: false, message: `Erreur ZR Express (${res.status}).` };
  }
  const statut = (data as { Statut?: string } | null)?.Statut ?? "";
  return { ok: statut === "Accès activé", message: statut || "Réponse inattendue." };
}

// ─── CREATE PARCEL (POST /add_colis) ──────────────────────────
export async function createProcolisParcel(
  order: Order,
  creds: ProcolisCredentials
): Promise<ProcolisParcelResult> {
  if (!order.client) throw new Error("Données client manquantes.");

  const wilayaId = Number(order.client.wilaya);
  if (!wilayaId || Number.isNaN(wilayaId)) {
    throw new Error("Wilaya du client invalide (IDWilaya requis).");
  }

  const colis = {
    Client: order.client.full_name,
    MobileA: order.client.phone,
    MobileB: "",
    Adresse: order.client.address,
    IDWilaya: wilayaId,
    Commune: order.client.commune,
    Total: order.total_amount,
    Note: "",
    TProduit: buildProductList(order.items),
    id_Externe: order.reference,
    Source: "",
    TypeLivraison: 0, // 0 = domicile
    TypeColis: 0,
    Confrimee: 1, // (orthographe API Procolis — volontaire)
  };

  const res = await fetch(`${PROCOLIS_API}/add_colis`, {
    method: "POST",
    headers: procolisHeaders(creds),
    body: JSON.stringify({ Colis: [colis] }),
  });

  const data = await res.json().catch(() => null);
  console.log("[Procolis /add_colis]", { status: res.status, body: data });

  if (!res.ok) {
    throw new Error(`Erreur ZR Express (${res.status}).`);
  }

  const parcel = (data as { Colis?: Array<{ MessageRetour?: string; Tracking?: string }> } | null)?.Colis?.[0];
  const message = parcel?.MessageRetour ?? "";

  if (message === "Double Tracking") {
    throw new Error("Un bon ZR Express existe déjà pour cette commande (doublon).");
  }
  if (message !== "Good") {
    throw new Error(message || "Création du bon ZR Express échouée.");
  }

  const tracking = parcel?.Tracking;
  if (!tracking) throw new Error("Numéro de tracking absent de la réponse ZR Express.");

  return { tracking };
}

// ─── FETCH PARCEL STATUS (POST /lire) ─────────────────────────
// Body "null" (texte) = tracking introuvable côté Procolis.
export async function fetchProcolisStatus(
  tracking: string,
  creds: ProcolisCredentials
): Promise<ProcolisParcelStatus | null> {
  const res = await fetch(`${PROCOLIS_API}/lire`, {
    method: "POST",
    headers: procolisHeaders(creds),
    body: JSON.stringify({ Colis: [{ Tracking: tracking }] }),
  });

  if (!res.ok) {
    console.warn(`[Procolis /lire] ${tracking} → ${res.status}`);
    return null;
  }

  const raw = await res.text();
  if (!raw || raw.trim() === "null") {
    console.warn(`[Procolis /lire] ${tracking} → tracking introuvable`);
    return null;
  }

  let data: { Colis?: Array<{ Situation?: string; Statut?: string }> } | null = null;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn(`[Procolis /lire] ${tracking} → JSON invalide`);
    return null;
  }

  const parcel = data?.Colis?.[0];
  return {
    tracking,
    last_status: parcel?.Situation ?? parcel?.Statut ?? "",
  };
}
