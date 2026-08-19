"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

// ⚠️ Cet écran est vu par le vendeur ET par le reviewer Meta pendant la vidéo
// d'App Review. Il a affiché « Connexion Meta réussie. » EN DUR jusqu'au
// 19 août 2026 — y compris quand Meta renvoyait une erreur. Un écran de succès
// codé en dur n'est pas une preuve : il doit décrire ce qui s'est réellement
// passé. Toute modif ici doit préserver la lecture de `error`.
export default function MetaCallbackClient() {
  const searchParams = useSearchParams();
  const attempted = useRef(false);

  const params = searchParams.toString();
  const deepLink = `livramobile://oauth-meta${params ? `?${params}` : ""}`;

  // Meta renvoie `error` + `error_description` quand le vendeur refuse ou que
  // la config de l'app est en défaut. `code` absent sans erreur explicite =
  // retour incomplet : on ne prétend pas que ça a marché.
  const metaError = searchParams.get("error_description") ?? searchParams.get("error");
  const hasCode = Boolean(searchParams.get("code"));
  const failed = Boolean(metaError) || !hasCode;

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    // On relaie TOUJOURS vers l'app — y compris l'erreur : app/oauth-meta.tsx
    // sait l'afficher. Ce qui change ici, c'est ce que l'écran DIT.
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
            backgroundColor: failed ? "rgba(199,91,57,0.6)" : "rgba(245,240,232,0.25)",
            margin: "0 auto 28px",
            borderRadius: "2px",
          }}
        />

        {failed ? (
          <>
            <p
              style={{
                fontSize: "15px",
                color: "#E0764E",
                marginBottom: "8px",
                lineHeight: "1.5",
                fontWeight: 600,
              }}
            >
              La connexion Meta n&apos;a pas abouti.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,240,232,0.55)",
                marginBottom: "32px",
                lineHeight: "1.5",
                wordBreak: "break-word",
              }}
            >
              {metaError ?? "Meta n'a pas renvoyé de code d'autorisation."}
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: "15px",
                color: "rgba(245,240,232,0.7)",
                marginBottom: "8px",
                lineHeight: "1.5",
              }}
            >
              Autorisation Meta reçue.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,240,232,0.4)",
                marginBottom: "32px",
                lineHeight: "1.5",
              }}
            >
              Retour automatique vers l&apos;application, qui termine la connexion…
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
          </>
        )}

        <a
          href={deepLink}
          style={{
            display: "inline-block",
            backgroundColor: "#232629",
            color: "#E0764E",
            fontWeight: "700",
            fontSize: "15px",
            letterSpacing: "0.3px",
            padding: "14px 28px",
            borderRadius: "28px",
            border: "1px solid rgba(199,91,57,0.35)",
            textDecoration: "none",
            boxShadow: "4px 4px 12px #0A0B0C, -4px -4px 12px #2C3035",
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
