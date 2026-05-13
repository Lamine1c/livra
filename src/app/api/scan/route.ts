import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyQrToken, generateDriverToken } from "@/lib/qr-token";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 400 });
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

  // If the mobile sent its deviceId, look up the driver and return a signed token
  // so it can authenticate GPS writes without a Supabase session.
  let deviceToken: string | null = null;
  const deviceId = req.nextUrl.searchParams.get("d");
  if (deviceId) {
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("device_id", deviceId)
      .maybeSingle();
    if (driver?.id) {
      deviceToken = generateDriverToken(driver.id as string);
    }
  }

  // Advance order status to "processing" (En traitement) on QR scan.
  // Only moves forward — won't downgrade an order already in progress.
  await supabase
    .from("orders")
    .update({ status: "processing" })
    .eq("id", result.orderId)
    .in("status", ["pending", "confirmed"]);

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    order,
    vendorName: vendor?.store_name ?? vendor?.full_name ?? "Vendeur LIVRA",
    expiresIn: 24 * 3600,
    deviceToken,
  });
}
