"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Bounce QR → app. Auto-deeplink ~300ms (livramobile://scan + le token `t` et params relayés)
// + secours /telecharger. AUCUN appel à /api/scan, AUCUNE PII affichée : un token qui circule
// (lien transféré, screenshot, crawler) ne doit rien révéler. C'est l'app, avec son deviceId,
// qui lit la commande.
export default function ScanClient() {
  const searchParams = useSearchParams();
  const attempted = useRef(false);

  const params = searchParams.toString();
  const deepLink = `livramobile://scan${params ? `?${params}` : ""}`;

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const timer = setTimeout(() => {
      window.location.href = deepLink;
    }, 300);
    return () => clearTimeout(timer);
  }, [deepLink]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1C1E21",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "#232629",
          borderRadius: "28px",
          padding: "40px 32px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          boxShadow: "4px 4px 16px #0A0B0C, -4px -4px 16px #2C3035",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "4px", color: "#F5F0E8", marginBottom: "8px" }}>
          LIVRA
        </div>
        <div style={{ width: "40px", height: "2px", backgroundColor: "rgba(245,240,232,0.25)", margin: "0 auto 28px", borderRadius: "2px" }} />

        <p style={{ fontSize: "15px", color: "rgba(245,240,232,0.7)", marginBottom: "8px", lineHeight: 1.5 }}>
          Commande LIVRA à traiter.
        </p>
        <p style={{ fontSize: "13px", color: "rgba(245,240,232,0.4)", marginBottom: "32px", lineHeight: 1.5 }}>
          Ouverture de l&apos;application LIVRA pour scanner cette commande…
        </p>

        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid rgba(199,91,57,0.3)",
            borderTopColor: "#C75B39",
            borderRadius: "50%",
            margin: "0 auto 32px",
            animation: "spin 0.8s linear infinite",
          }}
        />

        <a
          href={deepLink}
          style={{
            display: "block",
            backgroundColor: "#232629",
            color: "#E0764E",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.3px",
            padding: "14px 28px",
            borderRadius: "28px",
            border: "1px solid rgba(199,91,57,0.35)",
            textDecoration: "none",
            boxShadow: "4px 4px 12px #0A0B0C, -4px -4px 12px #2C3035",
            marginBottom: "16px",
          }}
        >
          Ouvrir LIVRA
        </a>
        <Link href="/telecharger" style={{ display: "inline-block", fontSize: "13px", color: "rgba(245,240,232,0.55)", textDecoration: "underline" }}>
          L&apos;application n&apos;est pas installée ? Télécharger LIVRA
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
