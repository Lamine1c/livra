import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APP_ID = process.env.META_APP_ID ?? "1958408901714613";
const REDIRECT_URI = process.env.META_REDIRECT_URI ?? "https://golivra.app/api/meta/auth/callback";
const SCOPE = [
  "leads_retrieval",
  "pages_show_list",
  "pages_manage_ads",
  "pages_read_engagement",
  "business_management",
  "ads_read",
].join(",");

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const state = crypto.randomUUID();

  const oauthUrl = new URL("https://www.facebook.com/v23.0/dialog/oauth");
  oauthUrl.searchParams.set("client_id", APP_ID);
  oauthUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set("scope", SCOPE);
  oauthUrl.searchParams.set("response_type", "code");

  const response = NextResponse.redirect(oauthUrl.toString());
  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 15,
    path: "/",
  });
  return response;
}
