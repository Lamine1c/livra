import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Ligne d'agrégat anonyme à la clôture d'une livraison ─────────────────────
// Doctrine D9 : garder l'insight, jeter la PII. Écrit dans public.delivery_insights
// (migration 031). Best-effort STRICT : aucune de ces fonctions ne throw — l'échec
// de l'insight ne doit JAMAIS bloquer la clôture d'une livraison.

// Précision geohash : 4 caractères ≈ cellule ~39 km × ~20 km (~760 km²).
// Choix W6 (moi + adversaire) : 4, PAS 5 ni 3.
//  - Une commune rurale DZ fait 10-50 km² et est DÉJÀ stockée ; un geohash 4 est donc
//    plus GROSSIER que la commune → il n'ajoute AUCUNE précision sub-commune (pas de
//    ré-identification par le geohash lui-même). geohash 5 (~4.9 km) approcherait la
//    maille commune en zone dense → écarté.
//  - L'adversaire proposait 3, mais 3 (~156 km) serait plus grossier qu'une wilaya →
//    heatmap inutile. 4 est le point sûr-et-utile.
// ⚠️ Résidu signalé par l'adversaire : distance_m + duree_course_s + commune + date +
// motif rare peuvent fingerprinter une course unique. La table est service_role UNIQUEMENT
// (pas d'expo publique) → risque borné ; si un dashboard PUBLIC est fait un jour, bucketiser
// distance/durée avant exposition. (Voir tasks/RAPPORT.md W6.)
const GEOHASH_PRECISION = 4;

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

// Geohash standard (base32), tronqué à `precision` caractères.
export function encodeGeohash(lat: number, lng: number, precision = GEOHASH_PRECISION): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2;
      if (lng >= lonMid) { idx = idx * 2 + 1; lonMin = lonMid; } else { idx = idx * 2; lonMax = lonMid; }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) { idx = idx * 2 + 1; latMin = latMid; } else { idx = idx * 2; latMax = latMid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}

const EARTH_R = 6371000; // mètres

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Somme des segments consécutifs d'une trace GPS (mètres, arrondi).
export function sumTrackMeters(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return Math.round(total);
}

// Date de clôture au fuseau Algérie (UTC+1, pas de DST) → 'YYYY-MM-DD'.
export function dzDeliveredOn(d: Date = new Date()): string {
  return new Date(d.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

type DB = SupabaseClient;

type InsightRow = {
  mode: "moto_perso" | "transporteur" | "refus_client";
  wilaya: string | null;
  commune: string | null;
  geohash: string | null;
  distance_m: number | null;
  duree_totale_s: number | null;
  duree_course_s: number | null;
  statut_final: string;
  motif_echec: string | null;
  delivered_on: string;
};

async function insertInsight(supabase: DB, row: InsightRow): Promise<void> {
  try {
    const { error } = await supabase.from("delivery_insights").insert(row);
    if (error) console.error("[delivery-insight] insert failed:", error.message);
  } catch (e) {
    console.error("[delivery-insight] insert threw:", e);
  }
}

function pickClient(order: unknown): { wilaya: string | null; commune: string | null } {
  const c = (order as { client?: unknown } | null)?.client;
  const row = Array.isArray(c) ? c[0] : c;
  return {
    wilaya: (row as { wilaya?: string } | null)?.wilaya ?? null,
    commune: (row as { commune?: string } | null)?.commune ?? null,
  };
}

function secondsBetween(fromIso: string | null | undefined, to: Date): number | null {
  if (!fromIso) return null;
  return Math.round((to.getTime() - new Date(fromIso).getTime()) / 1000);
}

// ─── Mode moto_perso : livrée (complete) ou retournée (cancel) ─────────────────
export async function recordMotoInsight(
  supabase: DB,
  opts: { deliveryId: string; orderId: string; statutFinal: "delivered" | "returned"; motif?: string | null }
): Promise<void> {
  try {
    const [{ data: order }, { data: delivery }, { data: positions }] = await Promise.all([
      supabase.from("orders").select("created_at, client:clients(wilaya, commune)").eq("id", opts.orderId).single(),
      supabase.from("deliveries").select("created_at, completed_at").eq("id", opts.deliveryId).single(),
      supabase.from("delivery_positions").select("lat, lng").eq("delivery_id", opts.deliveryId).order("created_at", { ascending: true }),
    ]);

    const { wilaya, commune } = pickClient(order);
    const pts = ((positions ?? []) as { lat: number; lng: number }[]).filter(
      (p) => typeof p.lat === "number" && typeof p.lng === "number"
    );
    const closedAt = delivery?.completed_at ? new Date(delivery.completed_at as string) : new Date();
    const last = pts.length > 0 ? pts[pts.length - 1] : null;

    await insertInsight(supabase, {
      mode: "moto_perso",
      wilaya,
      commune,
      geohash: last ? encodeGeohash(last.lat, last.lng) : null,
      distance_m: pts.length >= 2 ? sumTrackMeters(pts) : null,
      duree_totale_s: secondsBetween(order?.created_at as string | undefined, closedAt),
      duree_course_s: secondsBetween(delivery?.created_at as string | undefined, closedAt),
      statut_final: opts.statutFinal,
      motif_echec: opts.motif ?? null,
      delivered_on: dzDeliveredOn(closedAt),
    });
  } catch (e) {
    console.error("[delivery-insight] recordMotoInsight failed:", e);
  }
}

// ─── Mode transporteur : clôture via le cron de polling (delivered / returned) ─
export async function recordCarrierInsight(
  supabase: DB,
  opts: { orderId: string; statutFinal: "delivered" | "returned"; motif?: string | null }
): Promise<void> {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("created_at, client:clients(wilaya, commune)")
      .eq("id", opts.orderId)
      .single();
    const { wilaya, commune } = pickClient(order);
    const now = new Date();

    await insertInsight(supabase, {
      mode: "transporteur",
      wilaya,
      commune,
      geohash: null,
      distance_m: null,
      duree_totale_s: secondsBetween(order?.created_at as string | undefined, now),
      duree_course_s: null,
      statut_final: opts.statutFinal,
      motif_echec: opts.statutFinal === "returned" ? (opts.motif ?? "retour_transporteur") : null,
      delivered_on: dzDeliveredOn(now),
    });
  } catch (e) {
    console.error("[delivery-insight] recordCarrierInsight failed:", e);
  }
}

// ─── Mode refus_client : annulation « changé d'avis » via WhatsApp entrant ─────
export async function recordRefusInsight(
  supabase: DB,
  opts: { orderId: string; motif?: string | null }
): Promise<void> {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("created_at, client:clients(wilaya, commune)")
      .eq("id", opts.orderId)
      .single();
    const { wilaya, commune } = pickClient(order);
    const now = new Date();

    await insertInsight(supabase, {
      mode: "refus_client",
      wilaya,
      commune,
      geohash: null,
      distance_m: null,
      duree_totale_s: secondsBetween(order?.created_at as string | undefined, now),
      duree_course_s: null,
      statut_final: "cancelled",
      motif_echec: opts.motif ?? "refus_whatsapp",
      delivered_on: dzDeliveredOn(now),
    });
  } catch (e) {
    console.error("[delivery-insight] recordRefusInsight failed:", e);
  }
}
