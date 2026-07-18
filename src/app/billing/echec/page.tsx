import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Paiement non abouti — LIVRA",
  description: "Le paiement de l'abonnement LIVRA n'a pas abouti.",
  robots: { index: false, follow: false },
};

// États erreur = terracotta/ambre, jamais vert/rouge criard (règle CLAUDE.md).
export default function BillingEchecPage() {
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
              background: "rgba(var(--ambre-rgb), 0.10)",
              border: "1px solid rgba(var(--ambre-rgb), 0.35)",
              color: "var(--ambre)",
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
            Paiement non abouti
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: "15px", lineHeight: 1.6, color: "var(--mist)" }}>
            Le paiement a été annulé ou refusé. Aucun montant n&apos;a été débité.
            Tu peux réessayer depuis l&apos;app à tout moment.
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
            Réessayer depuis l&apos;app
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
