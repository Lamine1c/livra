import { NextRequest, NextResponse } from "next/server";
import { verifyDriverToken } from "@/lib/qr-token";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const verified = verifyDriverToken(token);
  if (!verified.valid) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("buyer_lat, buyer_lng, buyer_location_at, status")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    console.error("[check-buyer-location] order not found:", orderId, error?.message);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    buyer_lat: data.buyer_lat ?? null,
    buyer_lng: data.buyer_lng ?? null,
    buyer_location_at: data.buyer_location_at ?? null,
    status: data.status,
  });
}
