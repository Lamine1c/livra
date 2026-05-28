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

type CardConfig = {
  card: CardData;
  pos: CSSProperties;
  rotate: number;    // degrees, baked into the float keyframe via --jh-rot
  floatDur: number;  // seconds — desync between cards
  floatDel: number;  // seconds (negative = phase offset, starts mid-animation)
  mobileHide?: boolean;
};

// ── Back layer (4 cards) — blurred, faded, corners + upper center ──
const BACK_CONFIG: CardConfig[] = [
  {
    card: { type: "fb", name: "Karim", avatarColor: "var(--mist)", text: "Krahna men colis en instance" },
    pos: { top: "7%", left: "4%" },
    rotate: -5, floatDur: 7, floatDel: -2,
  },
  {
    card: { type: "wa", text: "chb3t krah fi liyyam", time: "08:14" },
    pos: { top: "5%", left: "56%" },
    rotate: 4, floatDur: 5.5, floatDel: -4,
    mobileHide: true,
  },
  {
    card: { type: "fb", name: "Yasmine", avatarColor: "var(--sapin)", text: "Meta takol f l'budget" },
    pos: { top: "66%", left: "8%" },
    rotate: -3, floatDur: 8, floatDel: -1,
    mobileHide: true,
  },
  {
    card: { type: "wa", text: "rassi tbloqua ya khawti", time: "hier" },
    pos: { top: "63%", left: "60%" },
    rotate: 6, floatDur: 6, floatDel: -3.5,
    mobileHide: true,
  },
];

// ── Front layer (5 cards) — crisp, surround + slightly overlap H1 ──
// Cards at 28-52% vertical overlap the H1's bounding box; halo + textShadow ensure readability.
const FRONT_CONFIG: CardConfig[] = [
  {
    card: { type: "wa", text: "H24 connecté sur Messenger, tgoul rani nakhdem f central téléphonique", time: "il y a 2h" },
    pos: { top: "28%", left: "2%" },
    rotate: -7, floatDur: 6.5, floatDel: -5,
  },
  {
    card: { type: "fb", name: "Sara", avatarColor: "var(--terracotta)", text: "L'livreur y3ayatlo ghir mara whda, ma yrépondich y9olo « retour »" },
    pos: { top: "24%", right: "2%" },
    rotate: 3, floatDur: 7.5, floatDel: -1.5,
  },
  {
    card: { type: "wa", text: "L'tracking y9ol « en cours », w l'livreur y9oli « dfa3to l'barah »", time: "il y a 6h" },
    pos: { top: "38%", left: "18%" },
    rotate: 5, floatDur: 5, floatDel: -3,
    mobileHide: true,
  },
  {
    card: { type: "fb", name: "Reda", avatarColor: "var(--ambre)", text: "30% de retour, hada machi business, hada rah tmaskhir b nass" },
    pos: { top: "66%", right: "4%" },
    rotate: -4, floatDur: 8.5, floatDel: -0.5,
  },
  {
    card: { type: "wa", text: "Un lead Meta à 2$, pour qu'à la fin il te dise « bch7al hada ? »", time: "hier" },
    pos: { top: "52%", left: "20%" },
    rotate: -6, floatDur: 6, floatDel: -4.5,
    mobileHide: true,
  },
];

// Glass card style — glassmorphism now allowed on LP (see LIVRA_BRAND.md exception marketing)
const CARD_STYLE: CSSProperties = {
  background: "color-mix(in srgb, var(--surface) 78%, transparent)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-card)",
  maxWidth: "420px",
  width: "max-content",
};

function CardWa({ text, time }: { text: string; time?: string }) {
  return (
    <div className="jh-card" style={{ ...CARD_STYLE, padding: "1.125rem 1.375rem" }}>
      <p className="jh-card-text" style={{ color: "var(--ivoire)", fontSize: "1rem", margin: 0, lineHeight: 1.45 }}>
        {text}
      </p>
      {time && (
        <p className="jh-card-meta" style={{ color: "var(--mist)", fontSize: "0.75rem", margin: "7px 0 0", textAlign: "right" }}>
          {time}
        </p>
      )}
    </div>
  );
}

function CardFb({ name, avatarColor, text }: Pick<CardData, "name" | "avatarColor" | "text">) {
  return (
    <div className="jh-card" style={{ ...CARD_STYLE, padding: "1.125rem 1.375rem", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
      <div className="jh-avatar" style={{
        width: 34, height: 34, borderRadius: "50%",
        background: avatarColor ?? "var(--mist)",
        flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "0.75rem",
        fontWeight: 600, color: "var(--ivoire)", opacity: 0.9,
      }}>
        {name?.charAt(0)}
      </div>
      <div>
        <p className="jh-card-meta" style={{ color: "var(--mist)", fontSize: "0.75rem", margin: "0 0 4px", fontWeight: 600 }}>
          {name}
        </p>
        <p className="jh-card-text" style={{ color: "var(--ivoire)", fontSize: "1rem", margin: 0, lineHeight: 1.45 }}>
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

    // Find the scrollable parent set by (site)/layout.tsx
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
        // Back disperses faster — the jungle "explodes" as you scroll out
        back.style.transform = `translateY(${sy * (isMobile ? 0.2 : 0.45)}px)`;
        front.style.transform = `translateY(${sy * (isMobile ? 0.07 : 0.12)}px)`;
        // Back layer fades to let content below emerge
        back.style.opacity = String(Math.max(0.1, 1 - Math.min(1, sy / (window.innerHeight * 0.5)) * 0.65));
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
        /*
         * Float keyframe: translateY oscillation + rotation baked via CSS var.
         * rotation (--jh-rot) stays constant through the keyframe = stable tilt.
         * scale (CSS individual transform property) composites independently
         * from transform, so it doesn't conflict with the animation.
         */
        @keyframes jh-float {
          0%, 100% { transform: translateY(0)    rotate(var(--jh-rot, 0deg)); }
          50%       { transform: translateY(-9px) rotate(var(--jh-rot, 0deg)); }
        }

        .jh-float {
          animation: jh-float var(--jh-dur, 7s) ease-in-out var(--jh-del, 0s) infinite;
        }

        /* Pulse on scroll hint */
        .jh-pulse {
          animation: jh-pulse 2.5s ease-in-out infinite;
        }
        @keyframes jh-pulse {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50%       { opacity: 0.8;  transform: translateY(5px); }
        }

        @media (max-width: 767px) {
          .jh-mob-hide { display: none !important; }

          /* Cards mobile : tailles réduites, laissent respirer le H1 */
          .jh-card      { max-width: 210px !important; padding: 0.7rem 0.9rem !important; }
          .jh-card-text { font-size: 0.8125rem !important; }
          .jh-card-meta { font-size: 0.625rem !important; }
          .jh-avatar    { width: 24px !important; height: 24px !important; font-size: 0.5625rem !important; }
        }

        /* Reduced motion: keep scatter layout + rotations, cut all animation */
        @media (prefers-reduced-motion: reduce) {
          .jh-back,
          .jh-front {
            transform: none !important;
            opacity: 1 !important;
          }
          .jh-float {
            animation: none !important;
            transform: rotate(var(--jh-rot, 0deg)) !important;
          }
          .jh-pulse { animation: none; opacity: 0.5; transform: none !important; }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--onyx)" }}
      >
        {/* ── Back layer — blurred + faded, disperses fast on scroll ── */}
        <div
          ref={layerBackRef}
          className="jh-back"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
        >
          {BACK_CONFIG.map((cfg, i) => (
            <div
              key={i}
              className={cfg.mobileHide ? "jh-mob-hide" : ""}
              style={{
                position: "absolute",
                ...cfg.pos,
                // CSS Individual Transform: scale composites separately from the
                // animation's transform (translateY + rotate) — no conflict.
                scale: "0.9",
                filter: "blur(0.8px)",
                opacity: 0.55,
              }}
            >
              <div
                className="jh-float"
                style={{
                  "--jh-rot": `${cfg.rotate}deg`,
                  "--jh-dur": `${cfg.floatDur}s`,
                  "--jh-del": `${cfg.floatDel}s`,
                } as CSSProperties}
              >
                <PainCard card={cfg.card} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Front layer — crisp, surround the H1, float at different rhythm ── */}
        <div
          ref={layerFrontRef}
          className="jh-front"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}
        >
          {FRONT_CONFIG.map((cfg, i) => (
            <div
              key={i}
              className={cfg.mobileHide ? "jh-mob-hide" : ""}
              style={{ position: "absolute", ...cfg.pos }}
            >
              <div
                className="jh-float"
                style={{
                  "--jh-rot": `${cfg.rotate}deg`,
                  "--jh-dur": `${cfg.floatDur}s`,
                  "--jh-del": `${cfg.floatDel}s`,
                } as CSSProperties}
              >
                <PainCard card={cfg.card} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Readability halo — dark radial behind H1 ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9,
            pointerEvents: "none",
            background: "radial-gradient(ellipse 65% 55% at 50% 50%, var(--onyx) 20%, transparent 70%)",
            opacity: 0.88,
          }}
        />

        {/* ── Center block — H1 + CTA (z10, always above cards) ── */}
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
          {/* font-weight 700 allowed on Hero titles per LIVRA_BRAND.md exception marketing */}
          <h1
            style={{
              color: "var(--ivoire)",
              fontSize: "clamp(3.5rem, 11vw, 9rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              margin: "0 0 2.5rem",
              // Dark shadow reinforces readability over any card that bleeds through the halo
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
