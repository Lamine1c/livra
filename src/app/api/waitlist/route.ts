import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;
  if (
    typeof email !== "string" ||
    !email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({ email: email.trim().toLowerCase(), source: "lp" });

  if (error) {
    // Unique violation = already registered
    if (error.code === "23505") {
      // Return success anyway — don't leak whether email exists
      return NextResponse.json({ success: true });
    }
    console.error("[waitlist]", error.message);
    return NextResponse.json({ error: "Une erreur est survenue. Réessayez." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
