import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateDriverToken, verifyDriverTokenAllowExpired } from "@/lib/qr-token";

export async function POST(req: NextRequest) {
  // 1. Bearer obligatoire (même expiré)
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const tokenVerif = verifyDriverTokenAllowExpired(token);
  if (!tokenVerif.valid) {
    return NextResponse.json({ error: "Invalid token signature" }, { status: 401 });
  }

  // 2. Body deviceId obligatoire
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

  // 3. Vérifier que le device_id correspond bien au driverId du token
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

  if (driver.id !== tokenVerif.driverId) {
    return NextResponse.json({ error: "Token/device mismatch" }, { status: 401 });
  }

  // 4. Émettre nouveau token
  const deviceToken = generateDriverToken(driver.id);
  return NextResponse.json({ deviceToken });
}
