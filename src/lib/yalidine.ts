import { Order } from "@/types";
import { WILAYAS } from "@/lib/utils";

const YALIDINE_API = "https://api.yalidine.app/v1";
const FROM_WILAYA = "Alger"; // wilaya d'expédition par défaut — configurable dans Paramètres (futur)

export const YALIDINE_TRACKING_URL = "https://www.yalidine.app/";

export interface YalidineParcelResult {
  tracking: string;
  label_url?: string;
}

function splitName(fullName: string): { firstname: string; familyname: string } {
  const i = fullName.indexOf(" ");
  if (i === -1) return { firstname: fullName, familyname: fullName };
  return { firstname: fullName.slice(0, i), familyname: fullName.slice(i + 1) };
}

function buildProductList(items: Order["items"]): string {
  if (!items?.length) return "Colis";
  return items.map((i) => `${i.product_name} x${i.quantity}`).join(", ");
}

export async function createYalidineParcel(
  order: Order,
  credentials: { centerId: string; token: string }
): Promise<YalidineParcelResult> {
  const { centerId, token } = credentials;
  if (!order.client) throw new Error("Données client manquantes.");

  const { firstname, familyname } = splitName(order.client.full_name);
  const toWilaya = WILAYAS[order.client.wilaya] ?? order.client.wilaya;

  const payload = {
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

  const res = await fetch(`${YALIDINE_API}/parcels/`, {
    method: "POST",
    headers: {
      "X-API-ID": centerId,
      "X-API-TOKEN": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("[Yalidine API]", { status: res.status, body: data });

  if (!res.ok) {
    const msg =
      data?.message ?? data?.error ?? `Erreur Yalidine (${res.status})`;
    throw new Error(msg);
  }

  // Yalidine renvoie le tracking dans data.tracking ou data[0].tracking selon la version
  const parcel = Array.isArray(data) ? data[0] : data?.data ?? data;
  const tracking = parcel?.tracking ?? parcel?.id;

  if (!tracking) throw new Error("Numéro de tracking absent de la réponse Yalidine.");

  return { tracking, label_url: parcel?.label_url };
}
