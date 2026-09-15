import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifySupabaseJwt } from "@/lib/meta";
import { addressOf, domainBodySchema, domainValidationFields } from "@/lib/inbound/vendor-source";

// LOT 13 · Porte n°0 — DELETE (révocation) + PATCH (changement de domaine) d'une source
// email par son PROPRIÉTAIRE. Auth Supabase JWT (même mécanique que GET/POST). Gardes
// communes : source du vendeur (user_id) + kind='email' + non révoquée. 404 anti-oracle
// dans TOUS les autres cas (inexistante, pas propriétaire, déjà révoquée) → réponse
// identique qu'on soit ou non le propriétaire.
export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const userId = await verifySupabaseJwt(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // UPDATE conditionnel unique : tous les filtres (slug + owner + kind + non-révoquée)
  // sont dans le WHERE. Zéro SELECT préalable → pas d'oracle : « pas à moi » et
  // « n'existe pas » et « déjà révoquée » renvoient tous 0 ligne → 404 identique.
  const { data, error } = await supabase
    .from("inbound_sources")
    .update({ revoked_at: new Date().toISOString(), active: false })
    .eq("email_slug", slug)
    .eq("user_id", userId)
    .eq("kind", "email")
    .is("revoked_at", null)
    .select("id");

  if (error) {
    console.error("[vendor/inbound-sources] DELETE", error.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ revoked: true }, { status: 200 });
}

// ─── PATCH : change le DOMAINE expéditeur SANS toucher au slug/adresse ────────────
// [W12] Le mobile implémentait « changer de domaine » comme revoke+create (→ nouveau slug
// → l'adresse email change → intégration Shopify/etc. cassée en silence). PATCH met à jour
// UNIQUEMENT expected_sender_domain de la source, en gardant email_slug/adresse intacts.
// Mêmes gardes que le DELETE (ownership + kind + non révoquée, 404 anti-oracle). Réponse =
// MÊME shape que le POST 201 (contrat imposé au mobile).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const userId = await verifySupabaseJwt(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "validation", fields: ["(invalid json)"] }, { status: 422 });
  }
  const parsed = domainBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: domainValidationFields(parsed.error) },
      { status: 422 }
    );
  }
  const expectedDomain = parsed.data.expected_sender_domain;

  const supabase = createServiceClient();

  // UPDATE conditionnel unique (mêmes gardes que DELETE) : ne touche QUE expected_sender_domain,
  // jamais email_slug. 0 ligne → 404 identique (pas d'oracle : pas à moi / inexistante / révoquée).
  const { data, error } = await supabase
    .from("inbound_sources")
    .update({ expected_sender_domain: expectedDomain })
    .eq("email_slug", slug)
    .eq("user_id", userId)
    .eq("kind", "email")
    .is("revoked_at", null)
    .select("email_slug, expected_sender_domain, active");

  if (error) {
    console.error("[vendor/inbound-sources] PATCH", error.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const row = data[0];
  return NextResponse.json(
    {
      slug: row.email_slug as string,
      address: addressOf(row.email_slug as string),
      expected_sender_domain: row.expected_sender_domain as string,
      active: row.active as boolean,
    },
    { status: 200 }
  );
}
