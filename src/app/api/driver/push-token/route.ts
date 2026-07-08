import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";

// Enregistre le token Expo Push du livreur (drivers.expo_push_token).
// Auth : Bearer deviceToken HMAC — même pattern que /api/driver/position.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const result = verifyDriverToken(authHeader.slice(7));
  if (!result.valid) {
    const status = result.expired ? 401 : 403;
    return NextResponse.json(
      { error: result.expired ? "Token expired" : "Invalid token" },
      { status }
    );
  }
  const { driverId } = result;

  let body: { expoPushToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token =
    typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : null;

  // Format Expo attendu : ExponentPushToken[...] (ou ExpoPushToken[...] legacy).
  if (!token || !/^Expo(nent)?PushToken\[.+\]$/.test(token)) {
    return NextResponse.json({ error: "Invalid Expo push token" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("drivers")
    .update({ expo_push_token: token })
    .eq("id", driverId);

  if (error) {
    console.error("[driver/push-token] update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
