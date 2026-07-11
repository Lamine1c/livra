import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";

// Formulaire de contact → email Resend vers contact@golivra.app.
// Rate-limit best-effort : 3 messages / heure par IP ET par email.
const CONTACT_RATE_LIMIT = 3;
const CONTACT_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 heure

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(4000),
  role: z.enum(["vendeur", "acheteur", "autre"]).optional(),
});

const ROLE_LABEL: Record<string, string> = {
  vendeur: "Vendeur",
  acheteur: "Acheteur",
  autre: "Autre",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const allowed =
    rateLimit(`contact:ip:${ip}`, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS) &&
    rateLimit(`contact:email:${body.email.toLowerCase()}`, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Réessaie dans une heure." },
      { status: 429 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY non configuré");
    return NextResponse.json({ error: "Service momentanément indisponible." }, { status: 503 });
  }

  const roleLabel = body.role ? ROLE_LABEL[body.role] : "Non précisé";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "LIVRA <noreply@golivra.app>",
    to: "contact@golivra.app",
    replyTo: body.email, // répondre = écrire directement au visiteur
    subject: `Contact LIVRA — ${body.name}${body.role ? ` (${roleLabel})` : ""}`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#0E0E10">
  <p><strong>Nom :</strong> ${escapeHtml(body.name)}</p>
  <p><strong>Email :</strong> ${escapeHtml(body.email)}</p>
  <p><strong>Profil :</strong> ${escapeHtml(roleLabel)}</p>
  <hr style="border:none;border-top:1px solid #E5E5E5;margin:16px 0" />
  <p style="white-space:pre-wrap">${escapeHtml(body.message)}</p>
</div>`,
  });

  if (error) {
    console.error("[contact] échec Resend:", error);
    return NextResponse.json({ error: "Envoi impossible pour le moment." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
