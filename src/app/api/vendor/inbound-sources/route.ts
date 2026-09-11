import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/rate-limit";
import { verifySupabaseJwt } from "@/lib/meta";

// LOT 13 · Porte n°0 — API vendeur « Connecter ma boutique » (self-serve).
//
// Le vendeur crée depuis l'app SA source email (auparavant seedée à la main en SQL).
// GET  → liste ses sources email.
// POST → crée une source email { slug, address, expected_sender_domain, active }.
//
// Auth = MÊME mécanique que les autres routes appelées par l'app mobile côté vendeur
// (meta/auth/exchange, meta/disconnect, meta/pages/subscribe) : Supabase JWT dans
// `Authorization: Bearer <access_token>` → verifySupabaseJwt → user_id. Toute requête
// est filtrée par CE user ; jamais de service_role sans filtre user.
export const runtime = "nodejs";

// L'adresse de réception (035_inbound_sources.email_slug est l'identité de la porte email).
const ORDERS_DOMAIN = "orders.golivra.app";

// ─── Validation du domaine expéditeur ────────────────────────────────────────
// Domaine nu, lowercase, ≥1 point, TLD alphabétique ≥2 (donc PAS une IP), sans
// schéma/chemin/port/@ (rejetés par le regex : ni « / » ni « : » ni « @ » admis).
// Sous-domaines autorisés (ex. mail.boutique-dz.com) — l'expéditeur peut en être un.
const DOMAIN_RE =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const bodySchema = z.object({
  expected_sender_domain: z
    .string()
    .trim()
    .toLowerCase()
    .refine((s) => DOMAIN_RE.test(s), { message: "invalid domain" }),
});

// ─── Génération du slug : base courte lisible + suffixe aléatoire (≥4) ────────
const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LEN = 5; // ≥4 exigé par le contrat

function randomSuffix(): string {
  const bytes = crypto.randomBytes(SUFFIX_LEN);
  let out = "";
  for (let i = 0; i < SUFFIX_LEN; i++) {
    out += SUFFIX_ALPHABET[bytes[i] % SUFFIX_ALPHABET.length];
  }
  return out;
}

function slugBase(storeName: string | null | undefined): string {
  const base = (storeName ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents (diacritiques combinants)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
  return base || "boutik";
}

function addressOf(slug: string): string {
  return `${slug}@${ORDERS_DOMAIN}`;
}

// ─── GET : les sources email du vendeur ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const userId = await verifySupabaseJwt(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("inbound_sources")
    .select("email_slug, expected_sender_domain, active")
    .eq("user_id", userId)
    .eq("kind", "email")
    .is("revoked_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[vendor/inbound-sources] GET", error.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const sources = (data ?? []).map((s) => ({
    slug: s.email_slug as string,
    address: addressOf(s.email_slug as string),
    expected_sender_domain: s.expected_sender_domain as string | null,
    active: s.active as boolean,
  }));
  return NextResponse.json({ sources }, { status: 200 });
}

// ─── POST : crée la source email du vendeur ──────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = await verifySupabaseJwt(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate-limit création (même mécanique que le reste du repo : rateLimit best-effort).
  if (!rateLimit(`vendor:inbound-source:create:${userId}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "rate_limited", retry_after: 60 }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "validation", fields: ["(invalid json)"] }, { status: 422 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const fields = Array.from(
      new Set(parsed.error.issues.map((i) => i.path.map(String).join(".")).filter(Boolean))
    );
    return NextResponse.json(
      { error: "validation", fields: fields.length ? fields : ["expected_sender_domain"] },
      { status: 422 }
    );
  }
  const expectedDomain = parsed.data.expected_sender_domain;

  const supabase = createServiceClient();

  // 409 si le vendeur a DÉJÀ une source email active (non révoquée).
  const { data: existing, error: existErr } = await supabase
    .from("inbound_sources")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", "email")
    .eq("active", true)
    .is("revoked_at", null)
    .maybeSingle();
  if (existErr) {
    console.error("[vendor/inbound-sources] POST exist-check", existErr.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ error: "already_connected" }, { status: 409 });
  }

  // Base de slug dérivée du nom de boutique du vendeur.
  const { data: profile } = await supabase
    .from("profiles")
    .select("store_name")
    .eq("id", userId)
    .maybeSingle();
  const base = slugBase(profile?.store_name as string | null | undefined);

  // Insert avec retry sur collision d'unicité du slug (email_slug UNIQUE en base).
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = `${base}-${randomSuffix()}`;
    const { data: inserted, error: insErr } = await supabase
      .from("inbound_sources")
      .insert({
        user_id: userId,
        kind: "email",
        email_slug: slug,
        expected_sender_domain: expectedDomain,
        active: true,
      })
      .select("email_slug, expected_sender_domain, active")
      .single();

    if (!insErr && inserted) {
      return NextResponse.json(
        {
          slug: inserted.email_slug as string,
          address: addressOf(inserted.email_slug as string),
          expected_sender_domain: inserted.expected_sender_domain as string,
          active: inserted.active as boolean,
        },
        { status: 201 }
      );
    }
    // 23505 = unique_violation (collision de slug) → on retente avec un autre suffixe.
    if (insErr && insErr.code === "23505") continue;
    console.error("[vendor/inbound-sources] POST insert", insErr?.message ?? "unknown");
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  console.error("[vendor/inbound-sources] POST slug collisions exhausted");
  return NextResponse.json({ error: "internal" }, { status: 500 });
}
