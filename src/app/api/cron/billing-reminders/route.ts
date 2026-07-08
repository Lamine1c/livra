import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { generateBillingActivationToken } from "@/lib/qr-token";
import { sendWhatsAppNotification } from "@/lib/whatsapp";
import {
  BILLING_REMINDER_SUBJECTS,
  renderBillingReminderEmail,
  type BillingReminderKind,
} from "@/lib/email/templates/billing-reminder-email";
import { vendorAmount } from "@/lib/chargily";

// ─── CRON RAPPELS FIN D'ESSAI ─────────────────────────────────
// Appelé par Vercel Cron 1×/jour (vercel.json). Protégé par CRON_SECRET,
// même pattern que /api/cron/yalidine-poll.
// Pour chaque vendeur en 'trial' actif (trial_ends_at > now) :
//   - J-3 : trial_ends_at entre J-2 et J-3 ET reminder_3d_sent_at NULL
//   - J-0 : trial_ends_at ≤ now+24h ET reminder_0d_sent_at NULL
// Chaque rappel = email Resend + WhatsApp best-effort (échec non bloquant).
// Idempotent : la colonne reminder_* est marquée après envoi de l'email.
// CTA : /billing/activer?t=<token HMAC (email, 7j)> — pas de session requise.

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 secondes max sur Vercel Hobby/Pro

const DAY_MS = 24 * 60 * 60 * 1000;

interface ReminderResult {
  email: string;
  kind: BillingReminderKind;
  emailSent: boolean;
  waSent: boolean;
  error?: string;
}

// Copy WA validée par Lamine (8 juil 2026).
function waMessage(kind: BillingReminderKind, amount: number, lien: string, dateFin: string): string {
  const quand = kind === "j3" ? `le ${dateFin}` : "aujourd'hui";
  return `⏳ Ton essai LIVRA se termine ${quand}. Active ton abonnement (${amount} DA/mois) : ${lien}. Tes données sont sauvegardées.`;
}

export async function GET(req: NextRequest) {
  // ─── Auth : vérifier le secret cron ─────────────────────────
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "https://golivra.app";
  const now = Date.now();
  const results: ReminderResult[] = [];

  try {
    // Trials actifs qui expirent dans les 3 prochains jours.
    const { data: vendors, error: fetchErr } = await supabase
      .from("vendors_waitlist")
      .select(
        "id, email, full_name, founder_index, trial_ends_at, reminder_3d_sent_at, reminder_0d_sent_at"
      )
      .eq("subscription_status", "trial")
      .not("trial_ends_at", "is", null)
      .gt("trial_ends_at", new Date(now).toISOString())
      .lte("trial_ends_at", new Date(now + 3 * DAY_MS).toISOString());

    if (fetchErr) {
      console.error("[Cron Billing] Erreur fetch vendors:", fetchErr);
      return NextResponse.json({ error: "Fetch vendors failed" }, { status: 500 });
    }

    if (!vendors || vendors.length === 0) {
      return NextResponse.json({ ok: true, checked: 0, results: [] });
    }

    for (const vendor of vendors) {
      const endsAt = new Date(vendor.trial_ends_at as string).getTime();

      // J-0 prioritaire sur J-3 (si les deux fenêtres se recouvrent).
      let kind: BillingReminderKind | null = null;
      if (endsAt <= now + DAY_MS && !vendor.reminder_0d_sent_at) {
        kind = "j0";
      } else if (
        endsAt > now + 2 * DAY_MS &&
        endsAt <= now + 3 * DAY_MS &&
        !vendor.reminder_3d_sent_at
      ) {
        kind = "j3";
      }
      if (!kind) continue;

      const result: ReminderResult = {
        email: vendor.email,
        kind,
        emailSent: false,
        waSent: false,
      };

      try {
        const amount = vendorAmount(vendor);
        const prenom = ((vendor.full_name as string | null) ?? "").split(" ")[0] ?? "";
        const token = generateBillingActivationToken(vendor.email);
        const lien = `${base}/billing/activer?t=${token}`;
        const isFounder = vendor.founder_index != null;
        const dateFin = new Date(endsAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
        });

        // ── Email Resend (même pattern que signup) ──
        // replyTo : la copy invite à répondre au mail — contact@golivra.app à
        // confirmer/créer côté Resend (sinon les réponses partent dans le vide).
        const { error: emailError } = await resend.emails.send({
          from: "LIVRA <noreply@golivra.app>",
          replyTo: "contact@golivra.app",
          to: vendor.email,
          subject: BILLING_REMINDER_SUBJECTS[kind],
          html: renderBillingReminderEmail(kind, prenom, amount, lien, dateFin, isFounder),
        });
        if (emailError) {
          // Colonne non marquée → retenté au prochain run.
          result.error = `Resend: ${emailError.message}`;
          results.push(result);
          continue;
        }
        result.emailSent = true;

        // ── Marquage idempotence (après envoi email) ──
        const column = kind === "j0" ? "reminder_0d_sent_at" : "reminder_3d_sent_at";
        const { error: markError } = await supabase
          .from("vendors_waitlist")
          .update({ [column]: new Date().toISOString() })
          .eq("id", vendor.id);
        if (markError) {
          console.error("[Cron Billing] marquage", column, "failed:", markError);
          result.error = `Marquage: ${markError.message}`;
        }

        // ── WhatsApp best-effort (échec non bloquant, loggé) ──
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("phone")
          .eq("email", vendor.email)
          .maybeSingle();
        if (profileError) {
          console.error("[Cron Billing] profile lookup failed:", profileError);
        }
        if (profile?.phone) {
          try {
            const wa = await sendWhatsAppNotification(
              profile.phone,
              waMessage(kind, amount, lien, dateFin)
            );
            result.waSent = wa.success;
            if (!wa.success) {
              console.error("[Cron Billing] WA échec pour", vendor.email, wa.error);
            }
          } catch (waErr) {
            console.error("[Cron Billing] WA erreur pour", vendor.email, waErr);
          }
        }

        results.push(result);
      } catch (err) {
        result.error = err instanceof Error ? err.message : "Unknown error";
        results.push(result);
      }
    }

    return NextResponse.json({
      ok: true,
      checked: vendors.length,
      sent: results.filter((r) => r.emailSent).length,
      results,
    });
  } catch (err) {
    console.error("[Cron Billing] Erreur:", err);
    return NextResponse.json(
      { error: "Erreur serveur", detail: String(err) },
      { status: 500 }
    );
  }
}
