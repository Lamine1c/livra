import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateDriverToken } from "@/lib/qr-token";

export async function POST(req: NextRequest) {
  let body: { deviceId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { deviceId } = body;
  if (typeof deviceId !== "string" || !deviceId) {
    return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("device_id", deviceId)
    .eq("whatsapp_verified", true)
    .maybeSingle();

  if (!driver?.id) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const deviceToken = generateDriverToken(driver.id);
  return NextResponse.json({ deviceToken });
}
