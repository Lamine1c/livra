import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/vendor/trust-layer — [N32W.3] TRUST LAYER : le compteur anti-J8 du vendeur.
// Auth : Bearer JWT Supabase (même pattern que /api/billing/status).
//
// CONTRAT (consommé tel quel par le mobile — champ additif, ignoré si inconnu) :
// 200 {
//   month: "YYYY-MM",              // mois EN COURS, fuseau Algérie (UTC+1)
//   avoided_orders_count: number,  // MESURÉ : commandes annulées/refusées/no-show du mois
//   estimated_da_saved: number,    // ESTIMÉ : somme du COD (total_amount) des commandes évitées
//   currency: "DZD"
// }
//
// POURQUOI ces sources (honnêteté au RAPPORT) :
// - Le vendeur (user_id) est REQUIS → on ne peut PAS s'appuyer sur `delivery_insights` :
//   cette table est ANONYME par doctrine D9 (migration 031 : « AUCUN order_id/client_id/user_id »)
//   → aucune attribution par vendeur possible. On lit donc `orders` directement (a user_id).
// - « Commande évitée » = `status='cancelled'` OU `decline_reason IS NOT NULL`. Doctrine confirmée
//   par buyer-score (« le statut "declined" n'existe pas — le refus = decline_reason »). Le no-show
//   au porte-à-porte se matérialise en `cancelled` (annulation livreur) → couvert. Un order à la fois
//   cancelled ET decline_reason (changé d'avis) = UNE ligne → compté une seule fois.
// - Fenêtre « du mois » = `updated_at` (= l'instant où le refus/annulation a été enregistré). MESURÉ.
// - `estimated_da_saved` est ESTIMÉ, pas mesuré : c'est la valeur COD BRUTE (total_amount) qu'auraient
//   représentée ces commandes — un plafond d'exposition évitée, PAS une perte nette réalisée. Les frais
//   de livraison ne sont pas ajoutés (le vrai coût d'un faux COD varie selon expédition/retour).

export const dynamic = "force-dynamic";

// Début du mois courant en fuseau Algérie (UTC+1, pas de DST) → instant UTC (ISO).
function dzMonthStartIso(nowMs: number): { since: string; month: string } {
  const dz = new Date(nowMs + 60 * 60 * 1000); // décale sur l'horloge murale UTC+1
  const y = dz.getUTCFullYear();
  const m = dz.getUTCMonth(); // 0-based
  // Minuit le 1er en heure DZ = instant UTC = Date.UTC(y, m, 1) − 1h (l'offset +01:00).
  const since = new Date(Date.UTC(y, m, 1) - 60 * 60 * 1000).toISOString();
  const month = `${y}-${String(m + 1).padStart(2, "0")}`;
  return { since, month };
}

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  const { since, month } = dzMonthStartIso(Date.now());
  const supabase = createServiceClient();

  // Commandes évitées du mois pour CE vendeur. Volume mensuel borné → agrégation en JS
  // (pas de RPC/SUM nécessaire). Borne de sécurité 5000 : au-delà, on log la troncature.
  const { data: rows, error } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("user_id", user.id)
    .gte("updated_at", since)
    .or("status.eq.cancelled,decline_reason.not.is.null")
    .limit(5000);

  if (error) {
    // Best-effort : ne jamais casser l'écran Trust Layer → 200 avec compteur à zéro.
    console.error("[vendor/trust-layer] lecture orders échouée:", error.message);
    return NextResponse.json({ month, avoided_orders_count: 0, estimated_da_saved: 0, currency: "DZD" });
  }

  if (rows && rows.length >= 5000) {
    console.warn(`[vendor/trust-layer] borne 5000 atteinte user=${user.id} mois=${month} — compteur tronqué`);
  }

  const avoided_orders_count = rows?.length ?? 0;
  const estimated_da_saved = (rows ?? []).reduce(
    (s, r) => s + Math.max(0, Math.round((r as { total_amount: number | null }).total_amount ?? 0)),
    0
  );

  return NextResponse.json({ month, avoided_orders_count, estimated_da_saved, currency: "DZD" });
}
