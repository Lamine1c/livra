import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";

export async function POST(req: NextRequest) {
  let body: { deviceToken?: unknown; deliveryId?: unknown; orderId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deviceToken, deliveryId, orderId } = body;

  if (typeof deviceToken !== "string" || !deviceToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  if (
    typeof deliveryId !== "string" || !deliveryId ||
    typeof orderId !== "string" || !orderId
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = verifyDriverToken(deviceToken);
  if (!result.valid) {
    const status = result.expired ? 401 : 403;
    return NextResponse.json(
      { error: result.expired ? "Token expired" : "Invalid token" },
      { status }
    );
  }
  const { driverId } = result;

  const supabase = createServiceClient();

  const { data: delivery, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, status, order_id, driver_id")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError || !delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }
  if (delivery.driver_id !== driverId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (delivery.order_id !== orderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  // Idempotent: already cancelled
  if (delivery.status === "cancelled") {
    return NextResponse.json({ ok: true });
  }
  // Cannot cancel a completed delivery
  if (delivery.status === "completed") {
    return NextResponse.json({ error: "Delivery already completed" }, { status: 409 });
  }

  const now = new Date().toISOString();

  const { error: delErr } = await supabase
    .from("deliveries")
    .update({ status: "cancelled", completed_at: now })
    .eq("id", deliveryId);

  if (delErr) {
    console.error("[cancel-delivery] deliveries update failed:", delErr.message);
    return NextResponse.json({ error: "Failed to cancel delivery" }, { status: 500 });
  }

  const { error: ordErr } = await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId);

  if (ordErr) {
    console.error("[cancel-delivery] orders update failed after cancellation:", ordErr.message);
    return NextResponse.json(
      { error: "Delivery cancelled but order status failed to update" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
