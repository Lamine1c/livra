import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { testProcolisCredentials } from "@/lib/procolis";

// Teste des identifiants ZR Express (token + key) saisis dans Réglages,
// AVANT de les sauvegarder. Appelle Procolis GET /token.
const bodySchema = z.object({
  token: z.string().trim().min(1, "Token requis"),
  key: z.string().trim().min(1, "Clé requise"),
});

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: authError ?? "Non authentifié" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token et clé requis." }, { status: 400 });
  }

  const result = await testProcolisCredentials({
    token: parsed.data.token,
    key: parsed.data.key,
  });

  return NextResponse.json({ ok: result.ok, message: result.message });
}
