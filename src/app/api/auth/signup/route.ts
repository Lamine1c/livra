import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtp } from "@/lib/auth/otp";
import { renderOtpEmail } from "@/lib/email/templates/otp-email";
import { rateLimit } from "@/lib/rate-limit";

// Rate-limit signup : 5 tentatives / heure, par IP et par email.
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 heure

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
  full_name: z.string().min(1),
  business_name: z.string().min(1),
  wilaya: z.string().min(1),
});

export async function POST(req: NextRequest) {
  console.log("[signup] Received request");
  const supabaseAdmin = createAdminClient();

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    body = bodySchema.parse(raw);
    console.log("[signup] Body parsed:", { email: body.email, wilaya: body.wilaya });
  } catch (err) {
    console.log("[signup] Body validation failed:", err);
    return NextResponse.json({ error: "Données invalides" }, { status: 400, headers: CORS_HEADERS });
  }

  // Step 1b: Rate-limit par IP + par email (5/heure, in-memory best-effort —
  // le throttle OTP en base ci-dessous reste la protection durable).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const ipAllowed = rateLimit(`signup:ip:${ip}`, SIGNUP_RATE_LIMIT, SIGNUP_RATE_WINDOW_MS);
  const emailAllowed = rateLimit(
    `signup:email:${body.email.toLowerCase()}`,
    SIGNUP_RATE_LIMIT,
    SIGNUP_RATE_WINDOW_MS
  );
  if (!ipAllowed || !emailAllowed) {
    console.log("[signup] Rate limit (5/h) hit for:", ipAllowed ? body.email : "ip");
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans une heure." },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  try {
    // NOTE PIVOT (juillet 2026) : aucun gating waitlist ici — cette route n'a
    // jamais rejeté les emails absents de vendors_waitlist. Elle UPSERT le
    // prospect dans vendors_waitlist (table qui sert de table vendeurs) puis
    // envoie l'OTP. Tout le monde peut s'inscrire ; seul un compte déjà
    // "active" est rejeté (409 ci-dessous). Flux OTP/vérification inchangé.

    // Step 2: Check if already active
    console.log("[signup] Checking vendors_waitlist for:", body.email);
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("vendors_waitlist")
      .select("*")
      .eq("email", body.email)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.log("[signup] Error fetching vendors_waitlist:", existingError);
      throw existingError;
    }

    // Step 3: Already active — 409 UNIQUEMENT si le compte auth existe vraiment.
    // Un inscrit "active" SANS ligne profiles = compte cassé (auth.users jamais créé,
    // bug historique) → on le laisse refaire le tunnel (OTP normal) pour créer enfin
    // son compte. profiles.email est posé par le trigger on_auth_user_created.
    if (existing && existing.status === "active") {
      const { data: activeProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", body.email)
        .maybeSingle();
      if (activeProfile) {
        console.log("[signup] Email already active:", body.email);
        return NextResponse.json(
          { error: "Tu es déjà inscrit·e" },
          { status: 409, headers: CORS_HEADERS }
        );
      }
      console.log("[signup] active mais aucun compte auth — on laisse refaire le tunnel:", body.email);
    }

    // Step 4: Rate limit — check for recent OTP
    console.log("[signup] Checking rate limit for:", body.email);
    const { data: recentOtp, error: rateLimitError } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("email", body.email)
      .is("used_at", null)
      .gt("created_at", new Date(Date.now() - 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitError) {
      console.log("[signup] Error checking rate limit:", rateLimitError);
      throw rateLimitError;
    }

    if (recentOtp) {
      console.log("[signup] Rate limit hit for:", body.email);
      return NextResponse.json(
        { error: "Patiente 1 minute avant de redemander un code" },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    // Step 5: Upsert vendors_waitlist
    console.log("[signup] Upserting vendors_waitlist for:", body.email);
    const { error: upsertError } = await supabaseAdmin
      .from("vendors_waitlist")
      .upsert(
        {
          email: body.email,
          full_name: body.full_name,
          business_name: body.business_name,
          wilaya: body.wilaya,
        },
        { onConflict: "email", ignoreDuplicates: false }
      );

    if (upsertError) {
      console.log("[signup] Error upserting vendors_waitlist:", upsertError);
      throw upsertError;
    }

    // Step 6: Generate OTP
    const code = generateOtp();
    console.log("[signup] OTP generated for:", body.email);

    // Step 7: Insert OTP record
    const { error: otpInsertError } = await supabaseAdmin
      .from("otp_codes")
      .insert({
        email: body.email,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (otpInsertError) {
      console.log("[signup] Error inserting OTP:", otpInsertError);
      throw otpInsertError;
    }

    // Step 8: Send email via Resend
    console.log("[signup] Sending OTP email to:", body.email);
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "LIVRA <noreply@golivra.app>",
      to: body.email,
      subject: "Ton code LIVRA",
      html: renderOtpEmail(code),
    });

    console.log("[signup] Email sent successfully to:", body.email);
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    console.log("[signup] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
