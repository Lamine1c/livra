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
const PRIVACY_VERSION = "v3-2026-08-14";

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

    // Step 3c: Créer (ou réinitialiser) le compte Supabase Auth AVANT d'écrire le
    // vendeur. Sans ligne auth.users, le vendeur ne peut jamais se connecter (l'app
    // mobile fait signInWithPassword). Le temp token prouve la possession de l'email
    // (OTP vérifié) → création légitime, ou reset légitime si le compte existe déjà.
    // Soit tout réussit, soit on n'écrit RIEN (pas de demi-état).
    const { data: vendorRow } = await supabaseAdmin
      .from("vendors_waitlist")
      .select("full_name, business_name")
      .eq("email", email)
      .maybeSingle();

    // profiles.email est posé par le trigger on_auth_user_created → la présence de la
    // ligne prouve que le user auth existe (listUsers n'est pas filtrable par email).
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    try {
      if (existingProfile?.id) {
        const { error: authUpdErr } = await supabaseAdmin.auth.admin.updateUserById(
          existingProfile.id as string,
          { password: body.password }
        );
        if (authUpdErr) throw authUpdErr;
      } else {
        const { error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: body.password,
          email_confirm: true,
          user_metadata: {
            full_name: vendorRow?.full_name ?? null,
            store_name: vendorRow?.business_name ?? null,
          },
        });
        if (authCreateErr) throw authCreateErr;
      }
    } catch (authErr) {
      // Le compte auth a échoué → on N'ÉCRIT PAS vendors_waitlist (tout ou rien).
      console.error("[set-password] auth user:", authErr);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Step 4: Update vendor with password hash, acceptance proof, set status active
    // + démarrage du trial 7 jours (026_billing_trial_gate).
    console.log("[set-password] Updating vendor record for:", email);
    const { error: updateError } = await supabaseAdmin
      .from("vendors_waitlist")
      .update({
        password_hash: hash,
        status: "active",
        activated_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

    // Step 5: Claim founder index via RPC ATOMIQUE (026_billing_trial_gate).
    // Remplace l'ancien count+update applicatif (race condition : deux
    // activations simultanées lisaient le même count). La RPC sérialise via
    // pg_advisory_xact_lock et retourne l'index attribué (ou déjà détenu),
    // NULL si les 50 places founders sont prises.
    console.log("[set-password] Claiming founder index for:", email);
    const { data: claimedIndex, error: claimError } = await supabaseAdmin.rpc(
      "claim_founder_index",
      { p_email: email }
    );

    if (claimError) {
      console.log("[set-password] Error claiming founder_index:", claimError);
      throw claimError;
    }

    const founderIndex = (claimedIndex as number | null) ?? null;
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
