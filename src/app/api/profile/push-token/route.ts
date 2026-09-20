import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { observeBody } from "@/lib/zod-observe";

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });
  }

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  observeBody("profile/push-token", z.object({ token: z.string().nullable().optional() }).passthrough(), body);

  const token = typeof body.token === "string" ? body.token.trim() : null;
  if (body.token !== null && !token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ expo_push_token: token })
    .eq("id", user.id);

  if (error) {
    console.error("[push-token] update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // [N32W.2] Multi-device : upsert dans push_tokens (best-effort, non bloquant). Tant que la
  // migration 043 n'est pas appliquée (table absente), on ignore l'erreur → la colonne unique
  // ci-dessus reste la source (fallback). token=null (désinscription) → rien à upsert.
  if (token) {
    const { error: ptErr } = await supabase
      .from("push_tokens")
      .upsert(
        { owner_type: "profile", owner_id: user.id, token, updated_at: new Date().toISOString() },
        { onConflict: "token" }
      );
    if (ptErr && !/42P01|PGRST205|does not exist|Could not find the table/i.test(`${ptErr.code ?? ""} ${ptErr.message ?? ""}`)) {
      console.error("[push-token] upsert push_tokens:", ptErr.message);
    }
  }

  return NextResponse.json({ ok: true });
}
