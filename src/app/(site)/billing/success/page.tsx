import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Paiement confirmé — LIVRA",
  description: "Confirmation de paiement de l'abonnement LIVRA.",
  robots: { index: false, follow: false },
};

// États succès = terracotta/ambre, jamais vert (règle CLAUDE.md).
export default function BillingSuccessPage() {
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
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
            Paiement confirmé
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: "15px", lineHeight: 1.6, color: "var(--mist)" }}>
            Merci ! Ton abonnement LIVRA est prolongé de 30 jours. La confirmation
            peut prendre quelques instants avant d&apos;apparaître dans l&apos;app.
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
            Retourner dans l&apos;app
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
