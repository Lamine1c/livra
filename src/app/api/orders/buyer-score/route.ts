import { NextRequest, NextResponse, after } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizePhoneNumber } from "@/lib/whatsapp";
import { observeBuyerScoreLookup } from "@/lib/buyer-score-audit";

// Score de fiabilité d'un acheteur, CROSS-VENDEURS (réseau LIVRA entier), pour UN numéro
// fourni en input. Vie privée : on ne retourne un score que pour le numéro donné (jamais
// d'annuaire, jamais de liste). Auth = session vendeur ; l'agrégat cross-vendeur utilise
// le service_role (jamais l'anon key ; RLS interdirait de voir les clients d'autres vendeurs).
//
// Signaux (déjà en prod) : orders.status = 'delivered' (livré) ; orders.decline_reason
// non null (refus, mig 022). Statut "declined" n'existe pas — le refus = decline_reason.
export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const whatsapp = (body as { whatsapp?: unknown } | null)?.whatsapp;
  if (typeof whatsapp !== "string" || !whatsapp.trim()) {
    return NextResponse.json({ error: "whatsapp requis" }, { status: 400 });
  }

  const normalized = normalizePhoneNumber(whatsapp);
  if (!normalized) {
    return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 1) Toutes les lignes clients (tous vendeurs) portant ce numéro normalisé.
  const { data: clientRows, error: clientErr } = await supabase
    .from("clients")
    .select("id")
    .eq("phone_normalized", normalized);

  if (clientErr) {
    console.error("[buyer-score] clients query failed:", clientErr.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  const clientIds = (clientRows ?? []).map((c) => c.id as string);
  if (clientIds.length === 0) {
    // Aucun historique dans LIVRA → nouveau. (Un canari atterrit ici : réponse
    // identique à tout numéro inconnu, aucun signe visible — l'alarme est côté serveur.)
    after(() => observeBuyerScoreLookup(supabase, { userId: user.id, normalized, level: "nouveau" }));
    return NextResponse.json({ level: "nouveau", delivered: 0, declined: 0, total: 0 });
  }

  // 2) Toutes les commandes de ces clients → agrégat livré / refusé.
  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("status, decline_reason")
    .in("client_id", clientIds);

  if (ordersErr) {
    console.error("[buyer-score] orders query failed:", ordersErr.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  let delivered = 0;
  let declined = 0;
  for (const o of orders ?? []) {
    if (o.status === "delivered") delivered += 1;
    if (o.decline_reason != null) declined += 1;
  }
  const total = delivered + declined; // "commandes complétées" = résolues (livrées ou refusées)

  // 3) Seuils : nouveau (0) · risque (≥2 refus OU taux ≥ 30%) · fiable (≥1 livraison, taux < 30%).
  let level: "fiable" | "nouveau" | "risque";
  if (total === 0) {
    level = "nouveau";
  } else if (declined >= 2 || declined / total >= 0.3) {
    level = "risque";
  } else {
    level = "fiable"; // total>0, pas risque → delivered ≥ 1 et taux < 30%.
  }

  // Observation best-effort, hors chemin critique (after()) : log audit + canari + volume.
  after(() => observeBuyerScoreLookup(supabase, { userId: user.id, normalized, level }));

  return NextResponse.json({ level, delivered, declined, total });
}
