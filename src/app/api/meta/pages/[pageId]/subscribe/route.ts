import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { graphFetch } from "@/lib/meta";

type Params = { params: Promise<{ pageId: string }> };

async function getPageToken(userId: string, pageId: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("meta_page_subscriptions")
    .select("page_access_token")
    .eq("user_id", userId)
    .eq("page_id", pageId)
    .single();
  return data?.page_access_token ?? null;
}

// POST — activate leadgen subscription on a page
export async function POST(req: NextRequest, { params }: Params) {
  const { pageId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pageToken = await getPageToken(session.user.id, pageId);
  if (!pageToken) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const res = await graphFetch(
    `${pageId}/subscribed_apps`,
    { subscribed_fields: "leadgen", access_token: pageToken },
    "POST"
  );

  if (!res.ok) {
    console.error("[meta/pages/subscribe POST] Graph API error:", res.data);
    return NextResponse.json({ error: "Meta API error", detail: res.data }, { status: 502 });
  }

  const service = createServiceClient();
  await service
    .from("meta_page_subscriptions")
    .update({ active: true })
    .eq("user_id", session.user.id)
    .eq("page_id", pageId);

  return NextResponse.json({ success: true });
}

// DELETE — deactivate leadgen subscription on a page
export async function DELETE(req: NextRequest, { params }: Params) {
  const { pageId } = await params;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pageToken = await getPageToken(session.user.id, pageId);
  if (!pageToken) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  // Best-effort unsubscribe — Meta may already be unsubscribed; ignore errors
  await graphFetch(
    `${pageId}/subscribed_apps`,
    { access_token: pageToken },
    "DELETE"
  );

  const service = createServiceClient();
  await service
    .from("meta_page_subscriptions")
    .update({ active: false })
    .eq("user_id", session.user.id)
    .eq("page_id", pageId);

  return NextResponse.json({ success: true });
}
