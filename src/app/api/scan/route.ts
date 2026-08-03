// ─────────────────────────────────────────────────────────────────────────────
// CONTRAT — /api/scan n'est PAS un endpoint web public. Toute PII et toute mutation
// exigent un driver résolu via `d`. Une page /scan (LOT 7) doit rester un aperçu
// SANS PII + deep link — elle ne doit JAMAIS appeler cet endpoint côté serveur pour
// afficher la commande.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyQrToken, generateDriverToken } from "@/lib/qr-token";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 400 });
  }

  // [C6 lockdown] `d` (deviceId) OBLIGATOIRE avant toute lecture de commande : sans lui,
  // aucun driver n'est authentifiable → aucune PII ne sort, aucun statut ne bouge. Un
  // token qui circule (lien transféré, QR screenshoté, crawler d'aperçu) ne doit rien
  // révéler ni muter. Sortie immédiate, avant même la vérification du token.
  const deviceId = req.nextUrl.searchParams.get("d");
  if (!deviceId) {
    return NextResponse.json({ error: "DEVICE_REQUIRED" }, { status: 401 });
  }

  const result = verifyQrToken(token);

  if (!result.valid) {
    const status = result.expired ? 410 : 400;
    return NextResponse.json(
      { ok: false, reason: result.expired ? "expired" : "invalid" },
      { status }
    );
  }

  const supabase = createServiceClient();

  // [C6 lockdown] Résoudre le driver AVANT de lire la commande : toute la PII et la
  // mutation de statut sont gatées sur un driver résolu.
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (!driver?.id) {
    // [C6 lockdown] deviceId fourni mais aucune ligne `drivers` → 401 UNREGISTERED,
    // zéro PII, zéro mutation.
    // Atteignable uniquement si /api/driver/me reconnaît le token mais que
    // drivers.device_id ≠ deviceId local ; le mobile affiche alors son Alert QR expiré
    // (scan.tsx:103). Routage propre vers /rejoindre = LOT 7.
    // (Un livreur NON inscrit n'arrive jamais ici : le mobile l'a déjà routé vers
    // /rejoindre en amont — absence de deviceId scan.tsx:86, unregistered scan.tsx:93.)
    console.error("[LOT1][C6] scan refusé UNREGISTERED — deviceId inconnu"); // marqueur alerte LOT 2 (captureConsole) — zéro PII, réponse inchangée
    return NextResponse.json({ error: "UNREGISTERED" }, { status: 401 });
  }

  const driverId = driver.id as string;

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      reference,
      status,
      delivery_mode,
      qr_token,
      total_amount,
      delivery_fee,
      notes,
      created_at,
      buyer_lat,
      buyer_lng,
      client:clients(full_name, phone, address, wilaya, commune),
      items:order_items(product_name, quantity, unit_price, total_price)
    `)
    .eq("id", result.orderId)
    .eq("qr_token", token)
    .single();

  if (error || !order) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const { data: vendor } = await supabase
    .from("profiles")
    .select("full_name, store_name, phone")
    .eq("id", result.vendorId)
    .single();

  // Driver résolu → token GPS signé (auth des écritures position sans session Supabase)
  // + marquage du dernier scan. [LOT1][A4] after() (jamais `void`) : Vercel peut tuer
  // l'exécution dès la réponse 200 → l'update disparaîtrait en silence. On le déplace
  // À L'INTÉRIEUR du bloc driver résolu (plus de `if (deviceId)` : d est obligatoire).
  // Erreur lue et loguée.
  const deviceToken = generateDriverToken(driverId);
  after(async () => {
    const { error } = await supabase.from("drivers").update({ last_scan_at: new Date().toISOString() }).eq("id", driverId);
    if (error) console.error("[LOT1][A4] scan update drivers.last_scan_at:", error.message);
  });

  // Advance order status to "processing" (En traitement) on QR scan — DANS le bloc
  // driver résolu (avant, c'était au niveau racine : un token sans `d` faisait avancer
  // le statut = cœur de la faille C6). Only moves forward — won't downgrade an order
  // already in progress.
  await supabase
    .from("orders")
    .update({ status: "processing" })
    .eq("id", result.orderId)
    .in("status", ["pending", "confirmed"]);

  // Flatten client fields so the mobile Order type (buyer_name, buyer_phone, etc.) is populated.
  const client = order.client
    ? (Array.isArray(order.client) ? order.client[0] : order.client)
    : null;

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    order: {
      ...order,
      buyer_name: client?.full_name ?? null,
      buyer_phone: client?.phone ?? null,
      buyer_address: client?.address ?? null,
      buyer_wilaya: client?.wilaya ?? null,
    },
    vendorName: vendor?.store_name ?? vendor?.full_name ?? "Vendeur LIVRA",
    expiresIn: 24 * 3600,
    deviceToken,
  });
}
