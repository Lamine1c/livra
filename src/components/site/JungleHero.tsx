"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

type CardData = {
  type: "wa" | "fb";
  name?: string;
  avatarColor?: string;
  text: string;
  time?: string;
};

const BACK_CARDS: CardData[] = [
  { type: "fb", name: "Karim", avatarColor: "var(--mist)", text: "Krahna men colis en instance" },
  { type: "wa", text: "chb3t krah fi liyyam", time: "08:14" },
  { type: "fb", name: "Yasmine", avatarColor: "var(--sapin)", text: "Meta takol f l'budget" },
  { type: "wa", text: "rassi tbloqua ya khawti", time: "hier" },
];

const FRONT_CARDS: CardData[] = [
  { type: "wa", text: "H24 connecté sur Messenger, tgoul rani nakhdem f central téléphonique", time: "il y a 2h" },
  { type: "fb", name: "Sara", avatarColor: "var(--terracotta)", text: "L'livreur y3ayatlo ghir mara whda, ma yrépondich y9olo « retour »" },
  { type: "wa", text: "L'tracking y9ol « en cours », w l'livreur y9oli « dfa3to l'barah »", time: "il y a 6h" },
  { type: "fb", name: "Reda", avatarColor: "var(--ambre)", text: "30% de retour, hada machi business, hada rah tmaskhir b nass" },
  { type: "wa", text: "Un lead Meta à 2$, pour qu'à la fin il te dise « bch7al hada ? »", time: "hier" },
];

// Absolute positions within each layer (corners / edges, never dead-center)
const BACK_POSITIONS: CSSProperties[] = [
  { top: "4%", left: "0%" },    // top-left
  { top: "60%", right: "0%" },  // lower-right
  { bottom: "4%", left: "14%" },// bottom, slight inset
  { top: "9%", right: "0%" },   // top-right
];

const FRONT_POSITIONS: CSSProperties[] = [
  { top: "12%", left: "0%" },   // top-left, in front of back[0]
  { top: "18%", right: "0%" },  // top-right, in front of back[3]
  { bottom: "10%", left: "0%" },// bottom-left
  { bottom: "16%", right: "0%" },// bottom-right
  { top: "56%", left: "0%" },   // mid-left
];

const CARD_BASE: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-card)",
  maxWidth: "272px",
  width: "max-content",
};

function CardWa({ text, time }: { text: string; time?: string }) {
  return (
    <div style={{ ...CARD_BASE, padding: "0.75rem 1rem" }}>
      <p style={{ color: "var(--ivoire)", fontSize: "0.8125rem", margin: 0, lineHeight: 1.45 }}>
        {text}
      </p>
      {time && (
        <p style={{ color: "var(--mist)", fontSize: "0.625rem", margin: "5px 0 0", textAlign: "right" }}>
          {time}
        </p>
      )}
    </div>
  );
}

function CardFb({ name, avatarColor, text }: Pick<CardData, "name" | "avatarColor" | "text">) {
  return (
    <div style={{ ...CARD_BASE, padding: "0.75rem 1rem", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: avatarColor ?? "var(--mist)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.5625rem",
          fontWeight: 600,
          color: "var(--ivoire)",
          opacity: 0.9,
        }}
      >
        {name?.charAt(0)}
      </div>
      <div>
        <p style={{ color: "var(--mist)", fontSize: "0.625rem", margin: "0 0 3px", fontWeight: 600 }}>
          {name}
        </p>
        <p style={{ color: "var(--ivoire)", fontSize: "0.8125rem", margin: 0, lineHeight: 1.45 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

function PainCard({ card }: { card: CardData }) {
  return card.type === "wa"
    ? <CardWa text={card.text} time={card.time} />
    : <CardFb name={card.name} avatarColor={card.avatarColor} text={card.text} />;
}

export default function JungleHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerBackRef = useRef<HTMLDivElement>(null);
  const layerFrontRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const back = layerBackRef.current;
    const front = layerFrontRef.current;
    if (!back || !front) return;

    const scrollEl =
      (containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null) ?? null;

    function getScrollY(): number {
      return scrollEl ? scrollEl.scrollTop : window.scrollY;
    }

    function onScroll() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!back || !front) return;
        const sy = getScrollY();
        const isMobile = window.innerWidth < 768;
        const backFactor = isMobile ? 0.25 : 0.5;
        const frontFactor = isMobile ? 0.08 : 0.15;

        back.style.transform = `translateY(${sy * backFactor}px)`;
        front.style.transform = `translateY(${sy * frontFactor}px)`;

        // Fade back layer progressively as user scrolls out of hero
        const progress = Math.min(1, sy / (window.innerHeight * 0.5));
        back.style.opacity = String(1 - progress * 0.65);
      });
    }

    const target: EventTarget = scrollEl ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <style>{`
        .jh-back  { will-change: transform; }
        .jh-front { will-change: transform; }
        .jh-back-card {
          filter: blur(3.5px);
          opacity: 0.42;
        }
        .jh-pulse {
          animation: jh-pulse 2.5s ease-in-out infinite;
        }
        @keyframes jh-pulse {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50%       { opacity: 0.8;  transform: translateY(5px); }
        }

        /* Mobile: hide extra back cards + shrink card width */
        @media (max-width: 767px) {
          .jh-mob-hide  { display: none !important; }
          .jh-card-wrap { max-width: 192px !important; }
        }

        /* Reduced motion: static layout, no parallax */
        @media (prefers-reduced-motion: reduce) {
          .jh-back,
          .jh-front {
            will-change: auto;
            transform: none !important;
            opacity: 1 !important;
          }
          .jh-pulse { animation: none; opacity: 0.55; transform: none; }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--onyx)" }}
      >
        {/* ── Back layer — blurred, distant ─────────────────── */}
        <div
          ref={layerBackRef}
          className="jh-back"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
        >
          {BACK_CARDS.map((card, i) => (
            <div
              key={i}
              className={`jh-back-card jh-card-wrap${i >= 1 ? " jh-mob-hide" : ""}`}
              style={{ position: "absolute", ...BACK_POSITIONS[i] }}
            >
              <PainCard card={card} />
            </div>
          ))}
        </div>

        {/* ── Front layer — crisp, nearer ───────────────────── */}
        <div
          ref={layerFrontRef}
          className="jh-front"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}
        >
          {FRONT_CARDS.map((card, i) => (
            <div
              key={i}
              className={`jh-card-wrap${i === 4 ? " jh-mob-hide" : ""}`}
              style={{ position: "absolute", ...FRONT_POSITIONS[i] }}
            >
              <PainCard card={card} />
            </div>
          ))}
        </div>

        {/* ── Readability halo behind H1 ─────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9,
            pointerEvents: "none",
            // Dark radial gradient from var(--onyx) → transparent, centered on H1
            background: "radial-gradient(ellipse 68% 58% at 50% 50%, var(--onyx) 22%, transparent 72%)",
            opacity: 0.9,
          }}
        />

        {/* ── Center block: H1 + CTA + hint ─────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "6rem 1.5rem 3rem",
          }}
        >
          <h1
            style={{
              color: "var(--ivoire)",
              fontSize: "clamp(3.5rem, 11vw, 8.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              margin: "0 0 2.5rem",
              // Dark shadow reinforces readability over any card that bleeds through
              textShadow: "0 2px 40px var(--onyx), 0 0 100px var(--onyx)",
            }}
          >
            Sortez de la jungle.
          </h1>

          <a
            href="#waitlist"
            style={{
              background: "var(--terracotta)",
              color: "var(--ivoire)",
              fontWeight: 600,
              borderRadius: "14px",
              padding: "14px 28px",
              fontSize: "0.9375rem",
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              boxShadow: "var(--shadow-btn-primary)",
              minHeight: "50px",
              transition: "filter 200ms ease-out",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = ""; }}
            aria-label="Rejoindre la liste d'attente"
          >
            Rejoindre la liste d&apos;attente
          </a>

          <p
            className="jh-pulse"
            style={{ color: "var(--mist)", fontSize: "0.8125rem", marginTop: "3rem" }}
            aria-hidden="true"
          >
            Vous vous reconnaissez là-dedans ? &#8595;
          </p>
        </div>
      </div>
    </>
  );
}
