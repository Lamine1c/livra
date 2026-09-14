import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifySupabaseJwt } from "@/lib/meta";

// LOT 13 · Porte n°0 — révocation d'une source email par son propriétaire.
// DELETE /api/vendor/inbound-sources/[slug] — auth Supabase JWT (même mécanique que
// GET/POST). La source doit APPARTENIR au vendeur (user_id), être kind='email' et
// non révoquée → revoked_at=now(), active=false → 200 { revoked: true }.
// 404 dans TOUS les autres cas (inexistante, pas propriétaire, déjà révoquée) : la
// réponse est identique qu'on soit ou non le propriétaire → aucun oracle d'existence.
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
