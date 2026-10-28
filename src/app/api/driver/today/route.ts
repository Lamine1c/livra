import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";
import { getActiveCourse } from "@/lib/driver-active-course";

// [T3-2] GET /api/driver/today — hub minimal du livreur (il manipule du cash, il lui faut sa journée).
// Auth : Bearer deviceToken HMAC (même mécanique que /api/driver/me, position, push-token). Lecture seule.
// Journée = jour calendaire ALGER (UTC+1, pas de DST), même convention que les autres agrégats du repo.
//  - collected_today   : somme des montants des courses TERMINÉES aujourd'hui (annulées EXCLUES).
//  - deliveries_count  : nombre de courses TERMINÉES aujourd'hui (base de collected_today).
//  - active_delivery   : la course active, mêmes champs que T3-1 (getActiveCourse) — null si aucune.
//  - items             : toutes les courses du jour (terminées + annulées), annulées affichées mais hors somme.
// Fenêtre « aujourd'hui » : terminées filtrées par `completed_at`, annulées par `created_at` (la table
// deliveries n'a PAS de `cancelled_at` — created_at est le seul horodatage disponible pour une annulation).
// Zéro migration : toutes les colonnes lues existent (deliveries 006/008, orders, profiles).

type OrderEmbed = { id?: string; reference?: string | null; total_amount?: number | null; user_id?: string | null };
type DeliveryRow = {
  id: string;
  status: string;
  completed_at: string | null;
  created_at: string | null;
  order: OrderEmbed | OrderEmbed[] | null;
};

function oneOrder(o: DeliveryRow["order"]): OrderEmbed | null {
  if (!o) return null;
  return Array.isArray(o) ? (o[0] ?? null) : o;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const verified = verifyDriverToken(authHeader.slice(7));
  if (!verified.valid) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const driverId = verified.driverId;

  // Bornes du jour calendaire ALGER (UTC+1) exprimées en instants UTC.
  const algNow = new Date(Date.now() + 60 * 60 * 1000);
  const startUtcMs = Date.UTC(algNow.getUTCFullYear(), algNow.getUTCMonth(), algNow.getUTCDate()) - 60 * 60 * 1000;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  const startIso = new Date(startUtcMs).toISOString();
  const endIso = new Date(endUtcMs).toISOString();

  const cols = "id, status, completed_at, created_at, order:orders(id, reference, total_amount, user_id)";

  // Terminées aujourd'hui (par completed_at) · Annulées aujourd'hui (par created_at, faute de cancelled_at).
  const [{ data: completedRows }, { data: cancelledRows }] = await Promise.all([
    supabase
      .from("deliveries")
      .select(cols)
      .eq("driver_id", driverId)
      .eq("status", "completed")
      .gte("completed_at", startIso)
      .lt("completed_at", endIso),
    supabase
      .from("deliveries")
      .select(cols)
      .eq("driver_id", driverId)
      .eq("status", "cancelled")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
  ]);

  const completed = (completedRows ?? []) as DeliveryRow[];
  const cancelled = (cancelledRows ?? []) as DeliveryRow[];

  // Nom de boutique par vendeur (une requête groupée, pas de jointure profiles non garantie en PostgREST).
  const userIds = Array.from(
    new Set([...completed, ...cancelled].map((r) => oneOrder(r.order)?.user_id).filter((v): v is string => !!v))
  );
  const shopById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, store_name, full_name").in("id", userIds);
    for (const p of (profs ?? []) as { id: string; store_name: string | null; full_name: string | null }[]) {
      shopById.set(p.id, p.store_name ?? p.full_name ?? "Vendeur LIVRA");
    }
  }

  const toItem = (r: DeliveryRow) => {
    const o = oneOrder(r.order);
    return {
      reference: o?.reference ?? (o?.id ? o.id.slice(0, 8).toUpperCase() : null),
      shop_name: o?.user_id ? (shopById.get(o.user_id) ?? "Vendeur LIVRA") : "Vendeur LIVRA",
      amount: Number(o?.total_amount ?? 0),
      status: r.status,
      completed_at: r.completed_at ?? null,
    };
  };

  // items = terminées + annulées, triées du plus récent au plus ancien (completed_at sinon created_at).
  const items = [...completed, ...cancelled]
    .map((r) => ({ r, ts: new Date(r.completed_at ?? r.created_at ?? 0).getTime() }))
    .sort((a, b) => b.ts - a.ts)
    .map(({ r }) => toItem(r));

  const collected_today = completed.reduce((sum, r) => sum + Number(oneOrder(r.order)?.total_amount ?? 0), 0);
  const deliveries_count = completed.length;

  const active = await getActiveCourse(supabase, driverId);

  return NextResponse.json({
    collected_today,
    deliveries_count,
    active_delivery: active?.activeCourse ?? null,
    items,
  });
}
