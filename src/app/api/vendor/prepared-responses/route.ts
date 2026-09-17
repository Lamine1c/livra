import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

// /api/vendor/prepared-responses — [N33W.3] FONDATION « rattrapage de vente » (winback).
// CRUD des réponses préparées du vendeur, déclenchables par un motif de refus RÉCUPÉRABLE
// (branche A `not_available` / C `found_cheaper` — cf. confirm-order.ts:278/:363).
// ⚠️ AUCUN envoi n'est câblé ici : ce endpoint ne fait que STOCKER (structure + garde). L'émission
// réelle (+ template Meta « offre datée ») viendra dans un lot ultérieur, gatée et désactivée par défaut.
// Auth : JWT Supabase (patron billing/status) ; toutes les lignes filtrées par user_id.
// Tant que la migration 045 n'est pas appliquée (table absente) → dégradation propre (pas de 500).

export const dynamic = "force-dynamic";

const TABLE_ABSENT_RE = /42P01|PGRST205|does not exist|Could not find the table/i;
function isTableAbsent(e: { code?: string; message?: string } | null): boolean {
  return !!e && TABLE_ABSENT_RE.test(`${e.code ?? ""} ${e.message ?? ""}`);
}

const upsertSchema = z.object({
  trigger_reason: z.enum(["not_available", "found_cheaper"]),
  body: z.string().trim().max(1000).optional(),
  discount_rate: z.number().int().min(0).max(90).nullable().optional(),
  validity_days: z.number().int().min(1).max(30).nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("prepared_responses")
    .select("id, trigger_reason, body, discount_rate, validity_days, active, updated_at")
    .eq("user_id", user.id)
    .order("trigger_reason", { ascending: true });

  if (error) {
    if (isTableAbsent(error)) return NextResponse.json({ responses: [], ready: false });
    console.error("[vendor/prepared-responses] GET échoué:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  return NextResponse.json({ responses: data ?? [], ready: true });
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  let parsed: z.infer<typeof upsertSchema>;
  try {
    parsed = upsertSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 422 });
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  // Upsert manuel sur (user_id, trigger_reason) : une réponse active par motif.
  const { data: existing, error: selErr } = await supabase
    .from("prepared_responses")
    .select("id")
    .eq("user_id", user.id)
    .eq("trigger_reason", parsed.trigger_reason)
    .maybeSingle();

  if (selErr) {
    if (isTableAbsent(selErr)) {
      return NextResponse.json({ error: "Fonction indisponible (migration 045 non appliquée)" }, { status: 503 });
    }
    console.error("[vendor/prepared-responses] POST select échoué:", selErr.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const fields = {
    body: parsed.body ?? null,
    discount_rate: parsed.discount_rate ?? null,
    validity_days: parsed.validity_days ?? null,
    active: parsed.active ?? true,
    updated_at: nowIso,
  };

  if (existing) {
    const { error } = await supabase.from("prepared_responses").update(fields).eq("id", existing.id);
    if (error) {
      console.error("[vendor/prepared-responses] POST update échoué:", error.message);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: existing.id, updated: true });
  }

  const { data: inserted, error } = await supabase
    .from("prepared_responses")
    .insert({ user_id: user.id, trigger_reason: parsed.trigger_reason, ...fields })
    .select("id")
    .single();
  if (error) {
    console.error("[vendor/prepared-responses] POST insert échoué:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: inserted.id, updated: false }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const reason = req.nextUrl.searchParams.get("reason");
  if (reason !== "not_available" && reason !== "found_cheaper") {
    return NextResponse.json({ error: "Paramètre reason invalide" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("prepared_responses")
    .delete()
    .eq("user_id", user.id)
    .eq("trigger_reason", reason);

  if (error) {
    if (isTableAbsent(error)) {
      return NextResponse.json({ error: "Fonction indisponible (migration 045 non appliquée)" }, { status: 503 });
    }
    console.error("[vendor/prepared-responses] DELETE échoué:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
