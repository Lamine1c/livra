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
  rotate: number;
  floatDur: number;
  floatDel: number;
  glowColor: string;  // CSS var — drives the directional color halo on the card
  mobileHide?: boolean;
};

// ── Back layer (4 cards) — blurred, faded, corners + upper center ──
const BACK_CONFIG: CardConfig[] = [
  {
    card: { type: "fb", name: "Karim", avatarColor: "var(--mist)", text: "Krahna men colis en instance" },
    pos: { top: "7%", left: "4%" },
    rotate: -5, floatDur: 7, floatDel: -2, glowColor: "var(--mist)",
  },
  {
    card: { type: "wa", text: "chb3t krah fi liyyam", time: "08:14" },
    pos: { top: "5%", left: "56%" },
    rotate: 4, floatDur: 5.5, floatDel: -4, glowColor: "var(--coral)",
    mobileHide: true,
  },
  {
    card: { type: "fb", name: "Yasmine", avatarColor: "var(--sapin)", text: "Meta takol f l'budget" },
    pos: { top: "66%", left: "8%" },
    rotate: -3, floatDur: 8, floatDel: -1, glowColor: "var(--sapin)",
    mobileHide: true,
  },
  {
    card: { type: "wa", text: "rassi tbloqua ya khawti", time: "hier" },
    pos: { top: "63%", left: "60%" },
    rotate: 6, floatDur: 6, floatDel: -3.5, glowColor: "var(--mist)",
    mobileHide: true,
  },
];

// ── Front layer (5 cards) — crisp, surround + slightly overlap H1 ──
// Cards at 28-52% vertical overlap the H1's bounding box; halo + textShadow ensure readability.
const FRONT_CONFIG: CardConfig[] = [
  {
    card: { type: "wa", text: "H24 connecté sur Messenger, tgoul rani nakhdem f central téléphonique", time: "il y a 2h" },
    pos: { top: "28%", left: "2%" },
    rotate: -7, floatDur: 6.5, floatDel: -5, glowColor: "var(--coral)",
  },
  {
    card: { type: "fb", name: "Sara", avatarColor: "var(--terracotta)", text: "L'livreur y3ayatlo ghir mara whda, ma yrépondich y9olo « retour »" },
    pos: { top: "24%", right: "2%" },
    rotate: 3, floatDur: 7.5, floatDel: -1.5, glowColor: "var(--terracotta)",
  },
  {
    card: { type: "wa", text: "L'tracking y9ol « en cours », w l'livreur y9oli « dfa3to l'barah »", time: "il y a 6h" },
    pos: { top: "38%", left: "18%" },
    rotate: 5, floatDur: 5, floatDel: -3, glowColor: "var(--ambre)",
    mobileHide: true,
  },
  {
    card: { type: "fb", name: "Reda", avatarColor: "var(--ambre)", text: "30% de retour, hada machi business, hada rah tmaskhir b nass" },
    pos: { top: "66%", right: "4%" },
    rotate: -4, floatDur: 8.5, floatDel: -0.5, glowColor: "var(--ambre)",
  },
  {
    card: { type: "wa", text: "Un lead Meta à 2$, pour qu'à la fin il te dise « bch7al hada ? »", time: "hier" },
    pos: { top: "52%", left: "20%" },
    rotate: -6, floatDur: 6, floatDel: -4.5, glowColor: "var(--terracotta)",
    mobileHide: true,
  },
];

// Glass card style — glassmorphism + light gradient (LP exception, LIVRA_BRAND.md)
// boxShadow is handled by the .jh-card CSS class (uses --jh-glow var for directional color halo)
const CARD_STYLE: CSSProperties = {
  // Linear gradient creates top-lighting illusion: lighter surface at top, deeper at bottom
  background: "linear-gradient(180deg, color-mix(in srgb, var(--surface) 88%, transparent) 0%, color-mix(in srgb, var(--deep) 75%, transparent) 100%)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  // Subtle border — inset highlight in .jh-card completes the top-lit look
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
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
        @keyframes jh-float {
          0%, 100% { transform: translateY(0)    rotate(var(--jh-rot, 0deg)); }
          50%       { transform: translateY(-9px) rotate(var(--jh-rot, 0deg)); }
        }
        .jh-float {
          animation: jh-float var(--jh-dur, 7s) ease-in-out var(--jh-del, 0s) infinite;
        }

        /*
         * Double shadow: deep drop (depth) + directional color halo (--jh-glow, set per-card).
         * Inset highlight on top edge = light comes from above (consistent direction).
         * All glows are STATIC — no pulse animation on light effects.
         */
        .jh-card {
          box-shadow:
            0 20px 50px -12px rgba(0,0,0,0.72),
            0 0 40px -8px var(--jh-glow, transparent),
            inset 0 1px 0 0 rgba(255,255,255,0.06);
        }

        /*
         * Film grain overlay on the hero background.
         * feTurbulence noise at 0.03 opacity — felt as material, not seen as texture.
         * Kills the "flat digital black" and gives a premium/filmic quality.
         */
        .jh-noise::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.55;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 250px 250px;
        }

        .jh-pulse {
          animation: jh-pulse 2.5s ease-in-out infinite;
        }
        @keyframes jh-pulse {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50%       { opacity: 0.8;  transform: translateY(5px); }
        }

        @media (max-width: 767px) {
          .jh-mob-hide { display: none !important; }
          /* Smaller cards on mobile */
          .jh-card      { max-width: 210px !important; padding: 0.7rem 0.9rem !important; }
          .jh-card-text { font-size: 0.8125rem !important; }
          .jh-card-meta { font-size: 0.625rem !important; }
          .jh-avatar    { width: 24px !important; height: 24px !important; font-size: 0.5625rem !important; }
          /* Lighter shadows on mobile for GPU budget */
          .jh-card {
            box-shadow:
              0 10px 28px -8px rgba(0,0,0,0.6),
              0 0 22px -6px var(--jh-glow, transparent),
              inset 0 1px 0 0 rgba(255,255,255,0.05);
          }
          /* Grain halved on mobile */
          .jh-noise::before { opacity: 0.3; }
        }

        @media (prefers-reduced-motion: reduce) {
          .jh-back, .jh-front { transform: none !important; opacity: 1 !important; }
          .jh-float { animation: none !important; transform: rotate(var(--jh-rot, 0deg)) !important; }
          .jh-pulse { animation: none; opacity: 0.5; transform: none !important; }
        }
      `}</style>

      <div
        ref={containerRef}
        className="jh-noise"
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          // Rich deep background: onyx base + 3 very faint nebula tints (terracotta top-left,
          // sapin bottom-right, mist center) at 5-6% — felt as depth, not seen as color.
          background: [
            "radial-gradient(ellipse 60% 45% at 12% 18%, color-mix(in srgb, var(--terracotta) 6%, transparent) 0%, transparent 65%)",
            "radial-gradient(ellipse 55% 50% at 86% 82%, color-mix(in srgb, var(--sapin) 5%, transparent) 0%, transparent 60%)",
            "radial-gradient(ellipse 35% 55% at 62% 28%, color-mix(in srgb, var(--mist) 3%, transparent) 0%, transparent 55%)",
            "var(--onyx)",
          ].join(", "),
        }}
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
                // perspective() + rotateX lean cards slightly back into 3D space;
                // scale composites via CSS Individual Transform, no conflict with animation.
                transform: "perspective(900px) rotateX(3deg) scale(0.9)",
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
                  // Back cards: glow at 8% — barely felt, not seen
                  "--jh-glow": `color-mix(in srgb, ${cfg.glowColor} 8%, transparent)`,
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
                  // Front cards: glow at 15% — subtle but perceptible, never above 0.18
                  "--jh-glow": `color-mix(in srgb, ${cfg.glowColor} 15%, transparent)`,
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
