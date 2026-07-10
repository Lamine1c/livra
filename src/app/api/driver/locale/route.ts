import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyDriverToken } from "@/lib/qr-token";

// Persiste la langue du livreur (drivers.locale, 'fr' | 'ar') — choisie via le
// sélecteur du hub driver mobile. Consommée par le futur envoi de notifications
// push localisées. Auth : Bearer deviceToken HMAC — même pattern que push-token.
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

  let body: { locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = body.locale === "fr" || body.locale === "ar" ? body.locale : null;
  if (!locale) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("drivers")
    .update({ locale })
    .eq("id", driverId);

  if (error) {
    console.error("[driver/locale] update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
