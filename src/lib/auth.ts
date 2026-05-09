import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabase = createServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { user: null, supabase: null, error: "Token invalide" };
    return { user, supabase, error: null };
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase: null, error: "Non authentifié" };
  return { user, supabase, error: null };
}
