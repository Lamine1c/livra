import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/vendor/trust-layer — [N32W.3] TRUST LAYER : le compteur anti-J8 du vendeur.
// Auth : Bearer JWT Supabase (même pattern que /api/billing/status).
//
// CONTRAT (consommé par le mobile — champ additif, ignoré si inconnu) :
// 200 {
//   window_days: 30,               // [N46W] fenêtre ROULANTE de 30 jours (remplace `month`)
//   avoided_orders_count: number,  // MESURÉ : commandes annulées/refusées/no-show sur la fenêtre
//   estimated_da_saved: number,    // ESTIMÉ : somme du COD (total_amount) des commandes évitées
//   currency: "DZD"
// }
//
// [N46W] Fenêtre = 30 JOURS GLISSANTS (décision Lamine, gate ZTE 21/09) : alignée sur le cycle
// d'abonnement (30 j) et jamais « vide » en début de mois. ⚠️ Le code web N32W.3 était en fenêtre
// CALENDAIRE (mois courant), PAS « 7 jours » : le « 7 j » évoqué au gate n'existe PAS côté web —
// c'est un libellé MOBILE (repo séparé, invérifiable d'ici) → cf. RAPPORT N46W (lot mobile à suivre).
//
// POURQUOI ces sources (honnêteté au RAPPORT) :
// - Le vendeur (user_id) est REQUIS → on ne peut PAS s'appuyer sur `delivery_insights` :
//   cette table est ANONYME par doctrine D9 (migration 031 : « AUCUN order_id/client_id/user_id »)
//   → aucune attribution par vendeur possible. On lit donc `orders` directement (a user_id).
// - « Commande évitée » = `status='cancelled'` OU `decline_reason IS NOT NULL`. Doctrine confirmée
//   par buyer-score (« le statut "declined" n'existe pas — le refus = decline_reason »). Le no-show
//   au porte-à-porte se matérialise en `cancelled` (annulation livreur) → couvert. Un order à la fois
//   cancelled ET decline_reason (changé d'avis) = UNE ligne → compté une seule fois.
// - Fenêtre = `updated_at` (= l'instant où le refus/annulation a été enregistré). MESURÉ.
// - `estimated_da_saved` est ESTIMÉ, pas mesuré : c'est la valeur COD BRUTE (total_amount) qu'auraient
//   représentée ces commandes — un plafond d'exposition évitée, PAS une perte nette réalisée. Les frais
//   de livraison ne sont pas ajoutés (le vrai coût d'un faux COD varie selon expédition/retour).
// - État vide = { avoided_orders_count: 0, estimated_da_saved: 0 } : l'API renvoie des NOMBRES bruts ;
//   le libellé « Vos économies apparaîtront ici » (jamais « 0 DA ») est géré CÔTÉ MOBILE — inchangé.

export const dynamic = "force-dynamic";

// Fenêtre glissante, en jours. L'index partiel de la migration 044 (user_id, updated_at) WHERE
// cancelled/declined couvre TOUJOURS cette requête (mêmes colonnes, seul le `since` change).
const WINDOW_DAYS = 30;

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createServiceClient();

  // Commandes évitées de la fenêtre pour CE vendeur. Volume borné → agrégation en JS
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
    return NextResponse.json({ window_days: WINDOW_DAYS, avoided_orders_count: 0, estimated_da_saved: 0, currency: "DZD" });
  }

  if (rows && rows.length >= 5000) {
    console.warn(`[vendor/trust-layer] borne 5000 atteinte user=${user.id} fenêtre=${WINDOW_DAYS}j — compteur tronqué`);
  }

  const avoided_orders_count = rows?.length ?? 0;
  const estimated_da_saved = (rows ?? []).reduce(
    (s, r) => s + Math.max(0, Math.round((r as { total_amount: number | null }).total_amount ?? 0)),
    0
  );

  return NextResponse.json({ window_days: WINDOW_DAYS, avoided_orders_count, estimated_da_saved, currency: "DZD" });
}
