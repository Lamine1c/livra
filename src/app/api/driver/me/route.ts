import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";

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
  // L'ancien crash recovery filtrait sur "in_progress" → cassé depuis migration 008.
  const { data: activeDelivery } = await supabase
    .from("deliveries")
    .select("id, order_id")
    .eq("driver_id", driver.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    id: driver.id,
    prenom: driver.prenom,
    hasActiveDelivery: !!activeDelivery,
    activeDeliveryId: activeDelivery?.id ?? null,
    activeOrderId: activeDelivery?.order_id ?? null,
  });
}
