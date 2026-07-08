import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTempToken } from "@/lib/auth/jwt";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://golivra.app",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

const bodySchema = z.object({
  tempToken: z.string(),
  password: z.string().min(8),
  termsAccepted: z.boolean(),
});

const TERMS_VERSION = "v2-2026-06-17";
const PRIVACY_VERSION = "v2-2026-06-17";

export async function POST(req: NextRequest) {
  console.log("[set-password] Received request");
  const supabaseAdmin = createAdminClient();

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    body = bodySchema.parse(raw);
    console.log("[set-password] Body parsed (tempToken present:", !!body.tempToken, ")");
  } catch (err) {
    console.log("[set-password] Body validation failed:", err);
    return NextResponse.json({ error: "Données invalides" }, { status: 400, headers: CORS_HEADERS });
  }

  // Step 1b: Require express acceptance of CGU + Privacy (legal proof)
  if (body.termsAccepted !== true) {
    console.log("[set-password] Terms not accepted — rejecting");
    return NextResponse.json(
      { error: "L'acceptation des CGU est requise." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    // Step 2: Verify temp token
    console.log("[set-password] Verifying temp token");
    const payload = verifyTempToken(body.tempToken);
    if (!payload) {
      console.log("[set-password] Invalid or expired temp token");
      return NextResponse.json(
        { error: "Session expirée" },
        { status: 401, headers: CORS_HEADERS }
      );
    }
    const email = payload.email;
    console.log("[set-password] Token valid for:", email);

    // Step 3: Hash password
    console.log("[set-password] Hashing password for:", email);
    const hash = await bcrypt.hash(body.password, 12);

    // Step 3b: Build legal acceptance proof (CGU art. 2.3)
    const termsIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const termsUserAgent = req.headers.get("user-agent") || null;

    // Step 4: Update vendor with password hash, acceptance proof, set status active
    console.log("[set-password] Updating vendor record for:", email);
    const { error: updateError } = await supabaseAdmin
      .from("vendors_waitlist")
      .update({
        password_hash: hash,
        status: "active",
        activated_at: new Date().toISOString(),
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        terms_ip: termsIp,
        terms_user_agent: termsUserAgent,
      })
      .eq("email", email);

    if (updateError) {
      console.log("[set-password] Error updating vendor record:", updateError);
      throw updateError;
    }

    // Step 5: Count existing founders (active with a founder_index)
    console.log("[set-password] Counting existing founders");
    const { count, error: countError } = await supabaseAdmin
      .from("vendors_waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .not("founder_index", "is", null);

    if (countError) {
      console.log("[set-password] Error counting founders:", countError);
      throw countError;
    }

    const founderCount = Number(count ?? 0);
    console.log("[set-password] Current founder count:", founderCount);

    // Step 6: Assign founder_index if still within the first 50
    if (founderCount < 50) {
      const founderIndex = founderCount + 1;
      console.log("[set-password] Assigning founder_index", founderIndex, "to:", email);
      const { error: founderUpdateError } = await supabaseAdmin
        .from("vendors_waitlist")
        .update({ founder_index: founderIndex })
        .eq("email", email)
        .is("founder_index", null);

      if (founderUpdateError) {
        console.log("[set-password] Error assigning founder_index:", founderUpdateError);
        throw founderUpdateError;
      }
    }

    // Step 7: Fetch final founder_index
    console.log("[set-password] Fetching final founder_index for:", email);
    const { data: row, error: fetchError } = await supabaseAdmin
      .from("vendors_waitlist")
      .select("founder_index")
      .eq("email", email)
      .single();

    if (fetchError) {
      console.log("[set-password] Error fetching founder_index:", fetchError);
      throw fetchError;
    }

    const founderIndex = row?.founder_index ?? null;
    console.log("[set-password] Done for:", email, "founder_index:", founderIndex);

    return NextResponse.json({ ok: true, founder_index: founderIndex }, { headers: CORS_HEADERS });
  } catch (err) {
    console.log("[set-password] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
