"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function MetaCallbackClient() {
  const searchParams = useSearchParams();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const params = searchParams.toString();
    // --/ prefix tells Expo Router this is a pure deep link, not a route
    const deepLink = `livramobile://--/oauth-meta${params ? `?${params}` : ""}`;

    const timer = setTimeout(() => {
      window.location.href = deepLink;
    }, 300);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const params = searchParams.toString();
  const deepLink = `livramobile://--/oauth-meta${params ? `?${params}` : ""}`;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1b1f",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "#1e2028",
          borderRadius: "28px",
          padding: "40px 32px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          boxShadow: "4px 4px 16px #0c0d11, -4px -4px 16px #1e1f24",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "4px",
            color: "#F5F0E8",
            marginBottom: "8px",
          }}
        >
          LIVRA
        </div>

        <div
          style={{
            width: "40px",
            height: "2px",
            backgroundColor: "rgba(7,106,77,0.5)",
            margin: "0 auto 28px",
            borderRadius: "2px",
          }}
        />

        <p
          style={{
            fontSize: "15px",
            color: "rgba(245,240,232,0.7)",
            marginBottom: "8px",
            lineHeight: "1.5",
          }}
        >
          Connexion Meta réussie.
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "rgba(245,240,232,0.4)",
            marginBottom: "32px",
            lineHeight: "1.5",
          }}
        >
          Retour automatique vers l&apos;application…
        </p>

        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid rgba(7,106,77,0.3)",
            borderTopColor: "#076a4d",
            borderRadius: "50%",
            margin: "0 auto 32px",
            animation: "spin 0.8s linear infinite",
          }}
        />

        <a
          href={deepLink}
          style={{
            display: "inline-block",
            backgroundColor: "#1e2028",
            color: "#076a4d",
            fontWeight: "700",
            fontSize: "15px",
            letterSpacing: "0.3px",
            padding: "14px 28px",
            borderRadius: "28px",
            border: "1px solid rgba(7,106,77,0.35)",
            textDecoration: "none",
            boxShadow: "4px 4px 12px #0c0d11, -4px -4px 12px #1e1f24",
          }}
        >
          Retourner vers LIVRA
        </a>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
