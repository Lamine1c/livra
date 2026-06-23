import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { testEcotrackToken, ECOTRACK_SLUG_BASE_URL } from "@/lib/ecotrack";

// Teste un token Ecotrack (DHD / Anderson) saisi dans Réglages, avant sauvegarde.
// Appelle GET /api/v1/validate/token du transporteur.
const bodySchema = z.object({
  carrier: z.enum(Object.keys(ECOTRACK_SLUG_BASE_URL) as [string, ...string[]]),
  token: z.string().trim().min(1, "Token requis"),
});

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Transporteur et token requis." }, { status: 400 });
  }

  const result = await testEcotrackToken(parsed.data.carrier, parsed.data.token);
  return NextResponse.json({ ok: result.ok, message: result.message });
}
