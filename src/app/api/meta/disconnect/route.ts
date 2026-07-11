import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { graphFetch, verifySupabaseJwt } from "@/lib/meta";

// Déconnexion Meta Ads : révoque le token côté Meta (best-effort) puis purge la
// DB (token + subscriptions de pages). L'app repasse alors en « Connecter Meta ».
export async function POST(req: NextRequest) {
  const userId = await verifySupabaseJwt(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Best-effort : demander à Meta de révoquer l'app (si le token est encore
  // valide). Un token déjà mort/révoqué échoue ici → on purge quand même.
  const { data: conn } = await service
    .from("meta_connections")
    .select("access_token")
    .eq("user_id", userId)
    .maybeSingle();
  const token = (conn as { access_token?: string } | null)?.access_token;
  if (token) {
    try {
      await graphFetch("me/permissions", { access_token: token }, "DELETE");
    } catch {
      // token révoqué/expiré côté Facebook — la purge DB ci-dessous suffit
    }
  }

  // Purge DB : subscriptions d'abord, puis la connexion.
  await service.from("meta_page_subscriptions").delete().eq("user_id", userId);
  await service.from("meta_connections").delete().eq("user_id", userId);

  return NextResponse.json({ success: true });
}
