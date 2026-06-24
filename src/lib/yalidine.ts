import { Order } from "@/types";
import { WILAYAS } from "@/lib/utils";

const YALIDINE_API = "https://api.yalidine.app/v1";
const FROM_WILAYA = "Alger";

export const YALIDINE_TRACKING_URL = "https://www.yalidine.app/";

// ─── STATUS MAPPING ───────────────────────────────────────────
// Mapping des statuts Yalidine vers les statuts internes LIVRA.
export const YALIDINE_STATUS_MAP: Record<string, string> = {
  "En attente":              "pending",
  "Expedie":                 "shipped",
  "Expédié":                 "shipped",
  "En cours de livraison":   "shipped",
  "Sorti en livraison":      "shipped",
  "Livre":                   "delivered",
  "Livré":                   "delivered",
  "Retourne":                "returned",
  "Retourné":                "returned",
  "Annule":                  "cancelled",
  "Annulé":                  "cancelled",
  "Echec livraison":         "returned",
  "Échec livraison":         "returned",
  "Client absent (echoue)":  "returned",
  "Client absent (échoué)":  "returned",
};

// Hiérarchie pour empêcher les régressions de statut
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
export interface YalidineCredentials {
  centerId: string;
  token: string;
}

export interface YalidineParcelResult {
  tracking: string;
  label_url?: string;
}

export interface YalidineParcelStatus {
  tracking: string;
  last_status: string;
}

// ─── HELPERS ──────────────────────────────────────────────────
function splitName(fullName: string): { firstname: string; familyname: string } {
  const i = fullName.indexOf(" ");
  if (i === -1) return { firstname: fullName, familyname: fullName };
  return { firstname: fullName.slice(0, i), familyname: fullName.slice(i + 1) };
}

function buildProductList(items: Order["items"]): string {
  if (!items?.length) return "Colis";
  return items.map((i) => `${i.product_name} x${i.quantity}`).join(", ");
}

function yalidineHeaders(creds: YalidineCredentials): HeadersInit {
  return {
    "X-API-ID": creds.centerId,
    "X-API-TOKEN": creds.token,
    "Content-Type": "application/json",
  };
}

// ─── CREATE PARCEL ────────────────────────────────────────────
export async function createYalidineParcel(
  order: Order,
  credentials: YalidineCredentials
): Promise<YalidineParcelResult> {
  if (!order.client) throw new Error("Données client manquantes.");

  const { firstname, familyname } = splitName(order.client.full_name);
  const toWilaya = WILAYAS[order.client.wilaya] ?? order.client.wilaya;

  const payload = {
    order_id: order.reference,
    firstname,
    familyname,
    contact_phone: order.client.phone,
    address: `${order.client.address}, ${order.client.commune}`,
    from_wilaya_name: FROM_WILAYA,
    to_wilaya_name: toWilaya,
    price: order.total_amount,
    do_insurance: false,
    declared_value: 0,
    height: 10,
    width: 20,
    length: 30,
    weight: 1,
    product_list: buildProductList(order.items),
    freeshipping: order.delivery_fee === 0,
    is_stopdesk: false,
    has_exchange: false,
  };

  // L'API /parcels/ attend un TABLEAU d'éléments (sinon 400 "in one or more elements").
  const res = await fetch(`${YALIDINE_API}/parcels/`, {
    method: "POST",
    headers: yalidineHeaders(credentials),
    body: JSON.stringify([payload]),
  });

  const data = await res.json();
  console.log("[Yalidine createParcel]", { status: res.status, body: data });

  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? `Erreur Yalidine (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  // Réponse batch : soit un tableau [{...}], soit un objet indexé par order_id { "REF": {...} }.
  // ⚠️ À re-tester avec un vrai compte Yalidine (pas de creds de test ici).
  const first =
    Array.isArray(data) ? data[0]
    : (data && typeof data === "object" ? Object.values(data)[0] : data);
  const parcel = (first ?? {}) as { success?: boolean; message?: string; tracking?: string; id?: string; label_url?: string };

  if (parcel.success === false) {
    throw new Error(parcel.message ?? "Création du bon Yalidine échouée.");
  }

  const tracking = parcel.tracking ?? parcel.id;
  if (!tracking) throw new Error("Numéro de tracking absent de la réponse Yalidine.");

  return { tracking, label_url: parcel.label_url };
}

// ─── FETCH PARCEL STATUS (POLLING) ────────────────────────────
export async function fetchParcelStatus(
  tracking: string,
  credentials: YalidineCredentials
): Promise<YalidineParcelStatus | null> {
  const res = await fetch(`${YALIDINE_API}/parcels/${tracking}`, {
    method: "GET",
    headers: yalidineHeaders(credentials),
  });

  if (!res.ok) {
    console.warn(`[Yalidine fetchStatus] ${tracking} → ${res.status}`);
    return null;
  }

  const data = await res.json();
  return {
    tracking,
    last_status: data?.last_status ?? data?.status ?? "",
  };
}
