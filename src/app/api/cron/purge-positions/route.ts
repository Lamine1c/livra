import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// ─── CRON PURGE GPS 30 J ──────────────────────────────────────
// Appelé par Vercel Cron 1×/jour (vercel.json), 3h30 (décalé de purge-leads à 3h00
// → pas de chevauchement de locks). Protégé par CRON_SECRET, même pattern que
// /api/cron/yalidine-poll et /api/cron/purge-leads.
//
// Toute la logique (critère clôture+30j, garde-fou course non clôturée, atomicité)
// vit dans la fonction SQL public.purge_expired_positions(p_dry) — migration 032.
// La purge ne perd aucune donnée : l'insight de la course est déjà écrit à la clôture
// (W6, delivery_insights).
//
// Gate manuel : GET ...?dry=1 → compte ce qui SERAIT supprimé, ne touche à rien.

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

  const { data, error } = await supabase.rpc("purge_expired_positions", { p_dry: dry });

  if (error) {
    console.error("[Cron PurgePositions] RPC purge_expired_positions a échoué:", error);
    return NextResponse.json({ error: "Purge failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...(data as Record<string, unknown>) });
}
