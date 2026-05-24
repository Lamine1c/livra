import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  exchangeShortTokenPKCE,
  exchangeLongLivedToken,
  getUserPages,
  graphFetch,
  verifySupabaseJwt,
} from "@/lib/meta";

// The redirect URI must match exactly what the mobile app sends.
// Scheme "livramobile" is declared in app.json.
const REDIRECT_URI = "livramobile://oauth-meta";

export async function POST(req: NextRequest) {
  const userId = await verifySupabaseJwt(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: unknown; code_verifier?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code, code_verifier } = body;
  if (typeof code !== "string" || !code || typeof code_verifier !== "string" || !code_verifier) {
    return NextResponse.json({ error: "Missing code or code_verifier" }, { status: 400 });
  }

  try {
    const short = await exchangeShortTokenPKCE(code, REDIRECT_URI, code_verifier);
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

    for (const page of pages) {
      await supabase.from("meta_page_subscriptions").upsert(
        {
          user_id: userId,
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token,
          active: false,
        },
        { onConflict: "user_id,page_id" }
      );
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
