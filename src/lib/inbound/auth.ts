import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

// LOT 13 · Porte n°1 — résolution de la clé API d'une source d'ingestion.
// La clé n'existe qu'en HASH en base (035_inbound_sources.api_key_hash) : on hash
// la clé reçue et on compare (même pattern sha256 que drivers/verify-otp/route.ts:57).
// Format attendu : `Bearer livra_sk_<32+ caractères>`.

const KEY_RE = /^livra_sk_[A-Za-z0-9]{32,}$/;

export async function resolveApiKey(
  authHeader: string | null
): Promise<{ sourceId: string; userId: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const key = authHeader.slice(7).trim();
  if (!KEY_RE.test(key)) return null;

  const apiKeyHash = crypto.createHash("sha256").update(key).digest("hex");

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("inbound_sources")
    .select("id, user_id")
    .eq("api_key_hash", apiKeyHash)
    .eq("kind", "api")
    .eq("active", true)
    .is("revoked_at", null)
    .maybeSingle();

  if (!data) return null;
  return { sourceId: data.id as string, userId: data.user_id as string };
}
