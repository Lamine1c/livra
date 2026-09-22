import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/vendor/trust-layer — [N32W.3] TRUST LAYER : le compteur anti-J8 du vendeur.
// Auth : Bearer JWT Supabase (même pattern que /api/billing/status).
//
// CONTRAT (consommé par le mobile — champs ADDITIFS, un vieux mobile ignore ce qu'il ne connaît pas) :
// 200 {
//   window_days: 30,               // fenêtre de 30 jours (DZ, alignée minuit Alger — cf. G6W)
//   avoided_orders_count: number,  // MESURÉ : commandes annulées/refusées/no-show sur la fenêtre
//   estimated_da_saved: number,    // ESTIMÉ : somme du COD (total_amount) des commandes évitées
//   currency: "DZD",
//   series: [                      // [G6W] 1 point par JOUR (fuseau Alger), du + ancien à aujourd'hui
//     { date: "YYYY-MM-DD", avoided_orders_count: number, estimated_da_saved: number }, … (window_days points)
//   ]                              // jours sans rien = ZÉRO explicite (pas de trou) ; Σ(series) == agrégats
// }
//
// [N46W→G6W] Fenêtre = 30 jours, **alignée sur les jours DZ (minuit Alger, UTC+1)** : chaque « jour » est
// un jour à Alger, pas UTC (une courbe décalée = un vendeur qui ne reconnaît pas sa semaine). L'alignement
// minuit garantit que la SÉRIE somme EXACTEMENT les agrégats (toute ligne de la fenêtre tombe dans un point).
//
// POURQUOI ces sources (honnêteté au RAPPORT) :
// - Le vendeur (user_id) est REQUIS → on ne peut PAS s'appuyer sur `delivery_insights` (anonyme, D9/031).
//   On lit `orders` directement (a user_id).
// - « Commande évitée » = `status='cancelled'` OU `decline_reason IS NOT NULL` (doctrine buyer-score).
// - **Date qui fait foi = `updated_at`** = l'instant où le refus/annulation a été enregistré (N45W/G3W) → c'est
//   bien la date de « détection » de la fausse commande. MESURÉ. (Confirmé G6W ④ : pas d'autre colonne plus juste.)
// - `estimated_da_saved` (et chaque point de série) est ESTIMÉ : COD BRUT évité, PAS une perte nette encaissée.
// - État vide = 0 partout ; le libellé « Vos économies apparaîtront ici » (jamais « 0 DA ») est géré CÔTÉ MOBILE.

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const DZ_OFFSET_MS = 60 * 60 * 1000; // Alger = UTC+1 (pas de DST)

// Date DZ (YYYY-MM-DD, minuit Alger) d'un instant UTC en ms.
function dzDate(ms: number): string {
  return new Date(ms + DZ_OFFSET_MS).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  const nowMs = Date.now();
  // Liste ordonnée des WINDOW_DAYS jours DZ (du plus ANCIEN à AUJOURD'HUI).
  const days: string[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) days.push(dzDate(nowMs - i * DAY_MS));
  // `since` = minuit DZ du 1er jour de la fenêtre → instant UTC (= Date.UTC(...) − offset). Aligné minuit
  // pour que la série somme exactement les agrégats. L'index partiel 044 (user_id, updated_at) le couvre.
  const [y, m, d] = days[0].split("-").map(Number);
  const since = new Date(Date.UTC(y, m - 1, d) - DZ_OFFSET_MS).toISOString();

  const supabase = createServiceClient();

  // Une seule requête (bornée 5000). La série se calcule en JS sur CES lignes → ZÉRO requête en plus.
  const { data: rows, error } = await supabase
    .from("orders")
    .select("total_amount, updated_at")
    .eq("user_id", user.id)
    .gte("updated_at", since)
    .or("status.eq.cancelled,decline_reason.not.is.null")
    .limit(5000);

  // Série vide (zéros explicites) réutilisée pour l'état vide ET les erreurs (best-effort).
  const emptySeries = () => days.map((date) => ({ date, avoided_orders_count: 0, estimated_da_saved: 0 }));

  if (error) {
    console.error("[vendor/trust-layer] lecture orders échouée:", error.message);
    return NextResponse.json({ window_days: WINDOW_DAYS, avoided_orders_count: 0, estimated_da_saved: 0, currency: "DZD", series: emptySeries() });
  }

  if (rows && rows.length >= 5000) {
    console.warn(`[vendor/trust-layer] borne 5000 atteinte user=${user.id} fenêtre=${WINDOW_DAYS}j — compteur tronqué`);
  }

  // Buckets par jour DZ (init à zéro pour TOUS les jours → pas de trou dans la courbe).
  const byDate = new Map(days.map((date) => [date, { avoided_orders_count: 0, estimated_da_saved: 0 }]));
  let avoided_orders_count = 0;
  let estimated_da_saved = 0;

  for (const r of rows ?? []) {
    const row = r as { total_amount: number | null; updated_at: string };
    const da = Math.max(0, Math.round(row.total_amount ?? 0));
    const bucket = byDate.get(dzDate(new Date(row.updated_at).getTime()));
    if (bucket) {
      bucket.avoided_orders_count += 1;
      bucket.estimated_da_saved += da;
    }
    avoided_orders_count += 1;
    estimated_da_saved += da;
  }

  const series = days.map((date) => ({ date, ...byDate.get(date)! }));
  return NextResponse.json({ window_days: WINDOW_DAYS, avoided_orders_count, estimated_da_saved, currency: "DZD", series });
}
