"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";

type Frame = {
  text: string[];
  italic?: boolean;
  isFinal?: boolean;
};

const FRAMES: Frame[] = [
  {
    text: [
      "Vous fermez votre boutique à 23h.",
      "Vous rouvrez votre téléphone à 7h.",
      "H24 connecté sur Messenger.",
      "Tgoul tnakhdem f central téléphonique.",
    ],
  },
  {
    text: [
      "30 leads Meta hier.",
      "25 ne répondront jamais.",
      "5 vont vous dire « bch7al hada ? »",
      "puis raccrocher.",
    ],
  },
  {
    text: [
      "Le tracking dit « en cours ».",
      "Le livreur dit « dfa3to l'barah ».",
      "Le client vous écrit « winraho l'colis ? ».",
      "Wana rani f l'dlam.",
    ],
  },
  {
    text: [
      "Yalidine vous facture le retour.",
      "Encore.",
      "Le retour koul l'bénéfice ta3 3 commandes livrées.",
    ],
  },
  {
    text: [
      "Vous ne dormez plus.",
      "Votre famille ne vous voit plus.",
      "Vous appelez ça « être patron ».",
    ],
    italic: true,
  },
  {
    text: ["Stop.", "Sortez de la jungle."],
    isFinal: true,
  },
];

export default function CinemaMode() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let rafId: number;

    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const viewH = window.innerHeight;
        const scrollable = section.offsetHeight - viewH;
        if (scrollable <= 0) return;
        const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
        const idx = Math.min(
          FRAMES.length - 1,
          Math.floor(progress * FRAMES.length)
        );
        setActiveIndex(idx);
      });
    }

    const scrollParent = section.closest(".overflow-y-auto") ?? window;
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollParent.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        .cinema-frame {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 400ms ease-out, transform 400ms ease-out;
          pointer-events: none;
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 2.5rem;
        }
        .cinema-frame.active {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .cinema-arrow-pulse {
          animation: cinema-arrow-pulse 2s ease-in-out infinite;
        }
        @keyframes cinema-arrow-pulse {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50%       { opacity: 1;   transform: translateY(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cinema-frame {
            transition: none;
          }
          .cinema-arrow-pulse {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>

      <div
        ref={sectionRef}
        style={{ height: `${FRAMES.length * 100}vh`, position: "relative" }}
        aria-label="Narration : votre semaine sans LIVRA"
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
          }}
        >
          {/* card */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "28px",
              border: "var(--border-surface)",
              boxShadow: "var(--shadow-card)",
              width: "100%",
              maxWidth: 560,
              minHeight: 320,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {FRAMES.map((frame, i) => {
              const isActive = i === activeIndex;

              if (frame.isFinal) {
                return (
                  <div
                    key={i}
                    className={`cinema-frame${isActive ? " active" : ""}`}
                    aria-hidden={!isActive}
                    style={{ alignItems: "center", textAlign: "center" }}
                  >
                    <p
                      style={{
                        color: "var(--terracotta)",
                        fontSize: "clamp(3rem, 10vw, 5rem)",
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                        margin: "0 0 1rem",
                      }}
                    >
                      {frame.text[0]}
                    </p>
                    <p
                      style={{
                        color: "var(--ivoire)",
                        fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                        margin: "0 0 2rem",
                      }}
                    >
                      {frame.text[1]}
                    </p>
                    <ArrowDown
                      size={24}
                      strokeWidth={1.5}
                      className="cinema-arrow-pulse"
                      style={{ color: "var(--terracotta)" }}
                      aria-hidden="true"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`cinema-frame${isActive ? " active" : ""}`}
                  aria-hidden={!isActive}
                >
                  {frame.text.map((line, j) => {
                    const isLastLine = j === frame.text.length - 1;
                    const useItalic = frame.italic && isLastLine;
                    return (
                      <p
                        key={j}
                        style={{
                          color: "var(--ivoire)",
                          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                          fontWeight: 400,
                          lineHeight: 1.6,
                          margin: "0 0 0.625rem",
                          fontStyle: useItalic ? "italic" : "normal",
                          opacity: useItalic ? 0.85 : 1,
                        }}
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* scroll hint — frame 0 only */}
          <p
            style={{
              color: "var(--mist)",
              fontSize: "0.75rem",
              marginTop: "1.25rem",
              opacity: activeIndex === 0 ? 0.5 : 0,
              transition: "opacity 400ms",
            }}
            aria-hidden="true"
          >
            Descendez pour continuer
          </p>
        </div>
      </div>
    </>
  );
}
