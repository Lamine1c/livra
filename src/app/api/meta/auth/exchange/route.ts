import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  exchangeShortToken,
  exchangeLongLivedToken,
  getUserPages,
  graphFetch,
  verifySupabaseJwt,
} from "@/lib/meta";

// The redirect URI must match exactly what the mobile app sends.
// Scheme "livramobile" is declared in app.json.
const REDIRECT_URI = "https://golivra.app/oauth/meta-callback";

export async function POST(req: NextRequest) {
  const userId = await verifySupabaseJwt(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code } = body;
  if (typeof code !== "string" || !code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const short = await exchangeShortToken(code, REDIRECT_URI);
    const long = await exchangeLongLivedToken(short.access_token);

    const meRes = await graphFetch("me", { fields: "id,name", access_token: long.access_token });
    const me = meRes.data as { id: string; name: string };

    const pages = await getUserPages(long.access_token);

    const supabase = createServiceClient();

    await supabase.from("meta_connections").upsert(
      {
        user_id: userId,
        meta_user_id: me.id,
        access_token: long.access_token,
        connected_at: new Date().toISOString(),
        last_refresh_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Reconnexion NON destructive : on préserve l'état "active" des pages qui
    // persistent (sinon chaque reconnexion — désormais fréquente vu l'expiration
    // ~60j du token — désactiverait toutes les souscriptions du vendeur).
    const { data: existingSubs } = await supabase
      .from("meta_page_subscriptions")
      .select("page_id, active")
      .eq("user_id", userId);
    const activeByPage = new Map(
      ((existingSubs as { page_id: string; active: boolean }[] | null) ?? []).map((s) => [
        s.page_id,
        s.active,
      ])
    );

    for (const page of pages) {
      await supabase.from("meta_page_subscriptions").upsert(
        {
          user_id: userId,
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token,
          active: activeByPage.get(page.id) ?? false,
        },
        { onConflict: "user_id,page_id" }
      );
    }

    // Retire les pages qui ne sont plus renvoyées par Meta (page supprimée ou
    // dont le vendeur a retiré l'accès) → la liste reflète la connexion fraîche.
    const freshPageIds = pages.map((p) => p.id);
    if (freshPageIds.length > 0) {
      await supabase
        .from("meta_page_subscriptions")
        .delete()
        .eq("user_id", userId)
        .not("page_id", "in", `(${freshPageIds.join(",")})`);
    }

    // Never return the access token to the mobile client
    return NextResponse.json({
      success: true,
      meta_user: { id: me.id, name: me.name },
      pages: pages.map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (err) {
    console.error("[meta/auth/exchange]", err);
    return NextResponse.json({ error: "Exchange failed" }, { status: 500 });
  }
}
