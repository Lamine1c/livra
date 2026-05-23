import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  exchangeShortToken,
  exchangeLongLivedToken,
  getUserPages,
  graphFetch,
} from "@/lib/meta";

const REDIRECT_URI = process.env.META_REDIRECT_URI ?? "https://golivra.app/api/meta/auth/callback";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("meta_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid state — possible CSRF" }, { status: 400 });
  }

  if (!code) {
    const error = req.nextUrl.searchParams.get("error_description") ?? "Missing code";
    return NextResponse.json({ error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const short = await exchangeShortToken(code, REDIRECT_URI);
    const long = await exchangeLongLivedToken(short.access_token);

    const meRes = await graphFetch("me", {
      fields: "id,name",
      access_token: long.access_token,
    });
    const me = meRes.data as { id: string; name: string };

    const pages = await getUserPages(long.access_token);

    const service = createServiceClient();

    await service.from("meta_connections").upsert(
      {
        user_id: session.user.id,
        meta_user_id: me.id,
        access_token: long.access_token,
        connected_at: new Date().toISOString(),
        last_refresh_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    for (const page of pages) {
      await service.from("meta_page_subscriptions").upsert(
        {
          user_id: session.user.id,
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token,
          active: false,
        },
        { onConflict: "user_id,page_id" }
      );
    }

    const response = NextResponse.redirect("https://golivra.app/meta-connected");
    response.cookies.delete("meta_oauth_state");
    return response;
  } catch (err) {
    console.error("[meta/auth/callback]", err);
    return NextResponse.json({ error: "OAuth flow failed" }, { status: 500 });
  }
}
