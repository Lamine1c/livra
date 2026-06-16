import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { signTempToken } from "@/lib/auth/jwt";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://golivra.app",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  console.log("[verify-otp] Received request");
  const supabaseAdmin = createAdminClient();

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    body = bodySchema.parse(raw);
    console.log("[verify-otp] Body parsed:", { email: body.email });
  } catch (err) {
    console.log("[verify-otp] Body validation failed:", err);
    return NextResponse.json({ error: "Données invalides" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    // Step 2: Fetch most recent unused OTP for this email
    console.log("[verify-otp] Fetching OTP record for:", body.email);
    const { data: otp, error: otpError } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("email", body.email)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.log("[verify-otp] Error fetching OTP:", otpError);
      throw otpError;
    }

    // Step 3: No valid OTP found
    if (!otp) {
      console.log("[verify-otp] No OTP found for:", body.email);
      return NextResponse.json(
        { error: "Code expiré, recommence" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Step 4: Check expiry
    if (new Date(otp.expires_at) < new Date()) {
      console.log("[verify-otp] OTP expired for:", body.email);
      return NextResponse.json(
        { error: "Code expiré, recommence" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Step 5: Check attempt count
    if (otp.attempts >= 3) {
      console.log("[verify-otp] Too many attempts for:", body.email);
      return NextResponse.json(
        { error: "Trop de tentatives, redemande un code" },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    // Step 6: Check code match
    if (otp.code !== body.code) {
      console.log("[verify-otp] Incorrect code for:", body.email, "attempts so far:", otp.attempts);
      const { error: incrementError } = await supabaseAdmin
        .from("otp_codes")
        .update({ attempts: otp.attempts + 1 })
        .eq("id", otp.id);

      if (incrementError) {
        console.log("[verify-otp] Error incrementing attempts:", incrementError);
        throw incrementError;
      }

      return NextResponse.json(
        { error: "Code incorrect" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Step 7: Mark OTP as used
    console.log("[verify-otp] Code matched, marking OTP as used for:", body.email);
    const { error: useOtpError } = await supabaseAdmin
      .from("otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otp.id);

    if (useOtpError) {
      console.log("[verify-otp] Error marking OTP used:", useOtpError);
      throw useOtpError;
    }

    // Step 8: Update vendor status to verified
    console.log("[verify-otp] Updating vendor status to verified for:", body.email);
    const { error: vendorUpdateError } = await supabaseAdmin
      .from("vendors_waitlist")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("email", body.email);

    if (vendorUpdateError) {
      console.log("[verify-otp] Error updating vendor status:", vendorUpdateError);
      throw vendorUpdateError;
    }

    // Step 9: Sign temp token
    const tempToken = signTempToken(body.email);
    console.log("[verify-otp] Temp token signed for:", body.email);

    return NextResponse.json({ ok: true, tempToken }, { headers: CORS_HEADERS });
  } catch (err) {
    console.log("[verify-otp] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
