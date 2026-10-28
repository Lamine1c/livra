import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";
import { getActiveCourse } from "@/lib/driver-active-course";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const verified = verifyDriverToken(token);
  if (!verified.valid) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  // Fetch driver basics
  const { data: driver, error: dErr } = await supabase
    .from("drivers")
    .select("id, prenom")
    .eq("id", verified.driverId)
    .maybeSingle();

  if (dErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Fetch active delivery (if any). status="active" = course active.
  // ⚠️ CORRECTION vs brief : le schéma (migrations 006/008) impose status ∈
  // {active, completed, cancelled} — "in_progress" n'existe plus (CHECK le rejette).
  // [T3-1] Reprise d'une course (V5-2) : avant, le mobile ne recevait que les UUID → écran sans nom
  // client, sans téléphone, sans montant, référence = UUID. `getActiveCourse` renvoie les infos
  // COMPLÈTES (mêmes noms de champs que /api/scan, durci sans otp_code/notes, réservé à ce livreur).
  // [T3-2] Même helper réutilisé par /api/driver/today (zéro duplication).
  const active = await getActiveCourse(supabase, driver.id);

  // [T3-1b] CONTRAT IMPOSÉ par le mobile (déjà codé, commit mobile e0954e0) : il lit `me.order` (même
  // objet que le `order` de /api/scan, `order.id` = activeOrderId) et `me.vendorName` AU PREMIER NIVEAU.
  // On expose donc order/vendorName/status_history à plat (plus de clé `activeCourse`). Les champs
  // existants (id, prenom, hasActiveDelivery, activeDeliveryId, activeOrderId) restent inchangés.
  return NextResponse.json({
    id: driver.id,
    prenom: driver.prenom,
    hasActiveDelivery: !!active,
    activeDeliveryId: active?.deliveryId ?? null,
    activeOrderId: active?.orderId ?? null,
    order: active?.activeCourse?.order ?? null,
    vendorName: active?.activeCourse?.vendorName ?? null,
    status_history: active?.activeCourse?.status_history ?? [],
  });
}
