"use client";

import type { CSSProperties } from "react";

type Bubble = {
  type: "wa" | "fb";
  name?: string;
  avatarColor?: string;
  text: string;
  time?: string;
  pos: CSSProperties;
  rotate: number;
  floatDur: number;
  floatDel: number;
  mobileHide?: boolean;
};

// 3 peripheral ghost bubbles — asymmetric triangle (top-left, top-right, bottom-right)
// Never near center H1. Suggestive, not narrative.
const BUBBLES: Bubble[] = [
  {
    type: "wa",
    text: "H24 connecté sur Messenger",
    time: "il y a 2h",
    pos: { top: "6%", left: "3%" },
    rotate: -4,
    floatDur: 6,
    floatDel: 0,
  },
  {
    type: "fb",
    name: "Karim",
    avatarColor: "var(--coral)",
    text: "Krahna men colis en instance",
    pos: { top: "10%", right: "3%" },
    rotate: 3,
    floatDur: 7.5,
    floatDel: -2.5,
    mobileHide: true,
  },
  {
    type: "wa",
    text: "30% de retour, hada machi business",
    time: "hier",
    pos: { bottom: "8%", right: "4%" },
    rotate: 2,
    floatDur: 8,
    floatDel: -5,
  },
];

function BubbleWa({ text, time }: { text: string; time?: string }) {
  return (
    <div className="jh-bubble-card">
      <p style={{ color: "var(--ivoire)", fontSize: "0.875rem", margin: 0, lineHeight: 1.45 }}>
        {text}
      </p>
      {time && (
        <p style={{ color: "var(--mist)", fontSize: "0.6875rem", margin: "6px 0 0", textAlign: "right" }}>
          {time}
        </p>
      )}
    </div>
  );
}

function BubbleFb({ name, avatarColor, text }: { name?: string; avatarColor?: string; text: string }) {
  return (
    <div className="jh-bubble-card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: avatarColor ?? "var(--mist)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.6875rem", fontWeight: 600, color: "var(--ivoire)",
      }}>
        {name?.charAt(0)}
      </div>
      <div>
        <p style={{ color: "var(--mist)", fontSize: "0.6875rem", margin: "0 0 3px", fontWeight: 600 }}>
          {name}
        </p>
        <p style={{ color: "var(--ivoire)", fontSize: "0.875rem", margin: 0, lineHeight: 1.45 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

export default function JungleHero() {
  return (
    <>
      <style>{`
        @keyframes jh-float {
          0%, 100% { transform: translateY(0)   rotate(var(--jh-rot, 0deg)); }
          50%       { transform: translateY(-5px) rotate(var(--jh-rot, 0deg)); }
        }
        .jh-float {
          animation: jh-float var(--jh-dur, 7s) ease-in-out var(--jh-del, 0s) infinite;
        }

        @keyframes jh-arrow {
          0%, 100% { opacity: 0.4; transform: translateX(-50%) translateY(0); }
          50%       { opacity: 0.75; transform: translateX(-50%) translateY(5px); }
        }
        .jh-arrow {
          animation: jh-arrow 2.5s ease-in-out infinite;
        }

        .jh-bubble-card {
          background: color-mix(in srgb, var(--surface) 82%, transparent);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 0.875rem 1.125rem;
          max-width: 260px;
        }

        @media (max-width: 767px) {
          .jh-mob-hide { display: none !important; }
          .jh-bubble-card { max-width: 180px !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .jh-float { animation: none !important; transform: rotate(var(--jh-rot, 0deg)) !important; }
          .jh-arrow { animation: none !important; opacity: 0.5 !important; transform: translateX(-50%) !important; }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          // Spotlight from top (ivoire 6%) — the H1 emerges lit from above.
          // Faint terracotta blush bottom-right to break the perfect symmetry.
          background: [
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--ivoire) 6%, transparent) 0%, transparent 65%)",
            "radial-gradient(ellipse 40% 30% at 88% 96%, color-mix(in srgb, var(--terracotta) 4%, transparent) 0%, transparent 60%)",
            "var(--onyx)",
          ].join(", "),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* ── Ghost bubbles — aria-hidden, float subtly, never near H1 ── */}
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={b.mobileHide ? "jh-mob-hide" : undefined}
            style={{
              position: "absolute",
              ...b.pos,
              opacity: 0.4,
              filter: "blur(2px)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <div
              className="jh-float"
              style={{
                "--jh-rot": `${b.rotate}deg`,
                "--jh-dur": `${b.floatDur}s`,
                "--jh-del": `${b.floatDel}s`,
              } as CSSProperties}
            >
              {b.type === "wa"
                ? <BubbleWa text={b.text} time={b.time} />
                : <BubbleFb name={b.name} avatarColor={b.avatarColor} text={b.text} />}
            </div>
          </div>
        ))}

        {/* ── Center sanctuaire — H1 + CTA + sous-titre ── */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "6rem 1.5rem 5rem",
          }}
        >
          <h1
            style={{
              color: "var(--ivoire)",
              fontSize: "clamp(3.5rem, 12vw, 10rem)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              margin: 0,
              maxWidth: "90vw",
            }}
          >
            Sortez de la jungle.
          </h1>

          {/* CTA — seul accent lumineux du Hero. Glow assumé, pas subtil. */}
          <a
            href="#waitlist"
            style={{
              marginTop: "2.75rem",
              background: "var(--terracotta)",
              color: "#ffffff",
              fontWeight: 600,
              borderRadius: "14px",
              padding: "1rem 2.5rem",
              fontSize: "0.9375rem",
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              minHeight: "52px",
              boxShadow: [
                "0 0 40px -8px color-mix(in srgb, var(--terracotta) 45%, transparent)",
                "0 4px 20px -4px color-mix(in srgb, var(--terracotta) 35%, transparent)",
              ].join(", "),
              transition: "filter 200ms ease-out, transform 200ms ease-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "";
              e.currentTarget.style.transform = "";
            }}
          >
            Rejoindre la liste d&apos;attente
          </a>

          <p
            style={{
              color: "var(--mist)",
              fontSize: "1rem",
              lineHeight: 1.6,
              maxWidth: "540px",
              fontWeight: 400,
              margin: "2rem auto 0",
            }}
          >
            LIVRA est l&apos;OS de votre e-commerce. De la pub Facebook au scan du colis, tout passe par un seul système.
          </p>
        </div>

        {/* ── Teaser bas de viewport ── */}
        <p
          className="jh-arrow"
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            color: "var(--mist)",
            fontSize: "0.8125rem",
            margin: 0,
            pointerEvents: "none",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
          aria-hidden="true"
        >
          Vous vous reconnaissez là-dedans ? ↓
        </p>
      </div>
    </>
  );
}
