import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyQrToken } from "@/lib/qr-token";

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

  const supabase = await createClient();

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

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    order,
    vendorName: vendor?.store_name ?? vendor?.full_name ?? "Vendeur LIVRA",
    expiresIn: 24 * 3600, // secondes restantes (conservateur : 24h depuis now)
  });
}
