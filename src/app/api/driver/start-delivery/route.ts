import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const verified = verifyDriverToken(token);
  if (!verified.valid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: { orderId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId } = body;
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Idempotent: check for ANY existing delivery row regardless of status
  const { data: existing } = await supabase
    .from("deliveries")
    .select("id, driver_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing?.id) {
    if (existing.driver_id !== verified.driverId) {
      return NextResponse.json(
        { error: "Cette commande est déjà prise par un autre motard" },
        { status: 409 }
      );
    }
    // Reactivate existing row (covers in_progress, cancelled, etc.)
    await supabase
      .from("deliveries")
      .update({ status: "active" })
      .eq("id", existing.id);
    return NextResponse.json({ deliveryId: existing.id });
  }

  const { data: delivery, error } = await supabase
    .from("deliveries")
    .insert({ order_id: orderId, driver_id: verified.driverId })
    .select("id")
    .single();

  if (error || !delivery) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ deliveryId: delivery.id });
}
