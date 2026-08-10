import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// ─── CRON PURGE RÉTENTION LEADS 90 J ──────────────────────────
// Appelé par Vercel Cron 1×/jour (vercel.json), heure creuse. Protégé par
// CRON_SECRET, même pattern que /api/cron/yalidine-poll.
//
// Toute la logique (passe unique par lead, log = pivot, ordre FK, insight
// anonyme, garde-fous, race) vit dans la fonction SQL atomique
// public.purge_expired_leads(p_dry) — migration 030. La route ne fait
// qu'authentifier + déléguer, pour garantir l'atomicité et l'idempotence
// (la table lead_insights n'a AUCUNE clé de dédup : l'exactly-once ne peut
// être tenu qu'en une transaction SQL, pas en JS multi-requêtes).
//
// Gate manuel : GET ...?dry=1 → la fonction classe et compte, n'écrit/ne
// supprime RIEN. C'est ce mode que Lamine lance avant d'activer le cron réel.

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 secondes max sur Vercel Hobby/Pro

export async function GET(req: NextRequest) {
  // ─── Auth : vérifier le secret cron ─────────────────────────
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("purge_expired_leads", { p_dry: dry });

  if (error) {
    console.error("[Cron PurgeLeads] RPC purge_expired_leads a échoué:", error);
    return NextResponse.json({ error: "Purge failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...(data as Record<string, unknown>) });
}
