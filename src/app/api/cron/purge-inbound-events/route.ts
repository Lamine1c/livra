import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// ─── CRON PURGE whatsapp_inbound_events (marqueurs de dédup wamid) ─────────────
// [N31W.3] Patron EXACT de /api/cron/purge-positions : Vercel Cron 1×/jour, protégé
// par CRON_SECRET. Toute la logique (cutoff 90 j, atomicité) vit dans la fonction SQL
// public.purge_expired_inbound_events(p_dry) — migration 042.
//
// ⚠️ Tant que 042 n'est PAS appliquée, la fonction n'existe pas → le cron tourne À VIDE
// (200 skipped) au lieu d'un 500, pour ne pas polluer les logs Vercel avant l'application.
//
// Gate manuel : GET ...?dry=1 → compte ce qui SERAIT supprimé, ne touche à rien.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("purge_expired_inbound_events", { p_dry: dry });

  if (error) {
    // Fonction absente = migration 042 non encore appliquée → no-op propre (200), pas 500.
    if (
      error.code === "PGRST202" ||
      error.code === "42883" ||
      /function .* does not exist|Could not find the function/i.test(error.message)
    ) {
      console.warn("[Cron PurgeInboundEvents] fonction absente (migration 042 non appliquée) → no-op");
      return NextResponse.json({ ok: true, skipped: "migration_not_applied" });
    }
    console.error("[Cron PurgeInboundEvents] RPC purge_expired_inbound_events a échoué:", error);
    return NextResponse.json({ error: "Purge failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...(data as Record<string, unknown>) });
}
