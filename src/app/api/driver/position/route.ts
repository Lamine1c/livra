import { NextRequest, NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const result = verifyDriverToken(authHeader.slice(7));
  if (!result.valid) {
    const status = result.expired ? 401 : 403;
    return NextResponse.json({ error: result.expired ? "Token expired" : "Invalid token" }, { status });
  }
  const { driverId } = result;

  let body: { deliveryId?: unknown; lat?: unknown; lng?: unknown; accuracy?: unknown; speed?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deliveryId, lat, lng, accuracy, speed } = body;

  if (
    typeof deliveryId !== "string" || !deliveryId ||
    typeof lat !== "number" || typeof lng !== "number"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify the delivery exists and belongs to this driver
  const { data: delivery, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, driver_id, status")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError || !delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }
  if (delivery.driver_id !== driverId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (delivery.status === "completed" || delivery.status === "cancelled") {
    return NextResponse.json({ error: "Delivery already closed" }, { status: 409 });
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("deliveries")
    .update({ last_lat: lat, last_lng: lng, last_position_at: now })
    .eq("id", deliveryId);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // History insert non-bloquant. [LOT1][A4] after() garde la fonction serverless
  // vivante après la réponse 200 : un `void` pouvait être tué par Vercel → l'historique
  // GPS disparaissait en silence. L'erreur d'insert est désormais lue et loguée.
  after(async () => {
    const { error } = await supabase.from("delivery_positions").insert({
      delivery_id: deliveryId,
      lat,
      lng,
      accuracy_m: typeof accuracy === "number" ? accuracy : null,
      speed_mps: typeof speed === "number" ? speed : null,
    });
    if (error) console.error("[LOT1][A4] driver/position insert delivery_positions:", error.message);
  });

  return NextResponse.json({ ok: true });
}
