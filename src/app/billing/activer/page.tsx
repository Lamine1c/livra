import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/site/Footer";
import { verifyBillingActivationToken } from "@/lib/qr-token";
import { createServiceClient } from "@/lib/supabase/service";
import { createVendorCheckout, getChargilySecret } from "@/lib/chargily";

export const metadata: Metadata = {
  title: "Activer mon abonnement — LIVRA",
  description: "Activation de l'abonnement LIVRA.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// /billing/activer?t=<token HMAC (email, 7j)> — CTA des emails/WA de rappel
// fin d'essai (cron billing-reminders). Les emails ne portent pas de session
// vendeur : le token signé identifie le vendeur, la page crée le checkout
// Chargily côté serveur et redirige vers checkout_url.
// États erreur = terracotta/ambre, jamais vert (règle CLAUDE.md).

function MessageCard({ title, body }: { title: string; body: string }) {
  return (
    <>
      <main
        style={{
          background: "var(--onyx)",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(48px,8vw,96px) 24px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            padding: "clamp(36px,5vw,56px) clamp(24px,4vw,40px)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 24px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(217,119,87,0.12)",
              border: "1px solid rgba(217,119,87,0.4)",
              color: "var(--terracotta)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(26px,4vw,32px)",
              letterSpacing: "-0.03em",
              color: "var(--ivoire)",
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: "15px", lineHeight: 1.6, color: "var(--mist)" }}>
            {body}
          </p>
          <Link
            href="/telecharger"
            style={{
              display: "inline-block",
              marginTop: "28px",
              padding: "12px 28px",
              borderRadius: "999px",
              background: "var(--terracotta)",
              color: "var(--onyx)",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Ouvrir l&apos;app LIVRA
          </Link>
          <p style={{ margin: "20px 0 0", fontSize: "13px" }}>
            <Link href="/" style={{ color: "var(--mist)", textDecoration: "underline" }}>
              Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default async function BillingActiverPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  const verification = verifyBillingActivationToken(t ?? "");
  if (!verification.valid) {
    return (
      <MessageCard
        title={verification.expired ? "Lien expiré" : "Lien invalide"}
        body="Ce lien d'activation n'est plus valide. Ouvre l'app LIVRA pour activer ton abonnement depuis ton compte."
      />
    );
  }

  const secret = getChargilySecret();
  if (!secret) {
    // Env CHARGILY_SECRET absente → page propre, pas de crash.
    return (
      <MessageCard
        title="Paiement non configuré"
        body="Le paiement en ligne n'est pas encore disponible. Réessaie plus tard ou contacte l'équipe LIVRA."
      />
    );
  }

  const supabase = createServiceClient();
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors_waitlist")
    .select("id, email, founder_index, chargily_customer_id")
    .eq("email", verification.email)
    .maybeSingle();

  if (vendorError) {
    console.error("[billing/activer] vendor lookup failed:", vendorError);
    return (
      <MessageCard
        title="Erreur serveur"
        body="Impossible de préparer le paiement pour le moment. Réessaie dans quelques minutes."
      />
    );
  }
  if (!vendor) {
    return (
      <MessageCard
        title="Compte introuvable"
        body="Aucun compte vendeur ne correspond à ce lien. Ouvre l'app LIVRA pour vérifier ton compte."
      />
    );
  }

  const base = process.env.NEXT_PUBLIC_API_BASE ?? "https://golivra.app";
  const result = await createVendorCheckout(vendor, base, secret);

  if (!result.ok) {
    return (
      <MessageCard
        title="Paiement indisponible"
        body="La création du paiement a échoué. Réessaie dans quelques minutes ou passe par l'app LIVRA."
      />
    );
  }

  // Mémorise l'id client Chargily (best-effort, comme /api/billing/checkout).
  if (result.customer_id && result.customer_id !== vendor.chargily_customer_id) {
    const { error: updateError } = await supabase
      .from("vendors_waitlist")
      .update({ chargily_customer_id: result.customer_id })
      .eq("id", vendor.id);
    if (updateError) {
      console.error("[billing/activer] chargily_customer_id update failed:", updateError);
    }
  }

  redirect(result.checkout_url);
}
