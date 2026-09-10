import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

// Waitlist Fondateur : tant que l'app n'est pas sur les stores, /pricing ne fait
// plus le signup complet. On collecte uniquement nom + WhatsApp dans
// vendors_waitlist. Un doublon WhatsApp = place déjà réservée (200, pas
// d'énumération). Aucune écriture email / OTP / mot de passe ici.

const WAITLIST_RATE_LIMIT = 5;
const WAITLIST_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 heure

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://golivra.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

// Nom 2..120. WhatsApp : espaces retirés puis format DZ local 0[567]xxxxxxxx.
const bodySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^0[567]\d{8}$/)),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Données invalides" },
      { status: 422, headers: CORS_HEADERS }
    );
  }

  // Rate-limit best-effort par IP (5/h) — même politique que /api/auth/signup.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`waitlist:ip:${ip}`, WAITLIST_RATE_LIMIT, WAITLIST_RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans une heure." },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from("vendors_waitlist")
      .insert({ full_name: body.full_name, whatsapp: body.whatsapp, status: "pending" });

    // 23505 = violation d'unicité (uq_vendors_waitlist_whatsapp) : le numéro est
    // déjà sur la liste. On répond 200 comme un premier enregistrement pour ne
    // pas révéler qui est déjà inscrit (pas d'énumération). Race-safe : deux
    // inserts simultanés du même numéro -> un OK, un 23505 -> tous deux 200.
    if (error && error.code !== "23505") {
      console.error("[waitlist] insert failed:", error);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[waitlist] unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
