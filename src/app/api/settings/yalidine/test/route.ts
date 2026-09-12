import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { testYalidineCredentials } from "@/lib/yalidine";

// N7.3 — Teste des identifiants Yalidine (X-API-ID + X-API-TOKEN) saisis dans Réglages, avant
// sauvegarde. Équivalent de settings/ecotrack/test. Endpoint API seulement (consommé par l'app mobile) :
// même mécanique d'auth (getAuthenticatedUser) et même forme de réponse { ok, message }.
const bodySchema = z.object({
  center_id: z.string().trim().min(1, "API ID requis"),
  token: z.string().trim().min(1, "Token requis"),
});

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "API ID et token requis." }, { status: 400 });
  }

  const result = await testYalidineCredentials(parsed.data.center_id, parsed.data.token);
  return NextResponse.json({ ok: result.ok, message: result.message });
}
