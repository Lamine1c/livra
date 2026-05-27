"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorSmartphone, Users, MapPin, Zap, Package, CheckCircle } from "lucide-react";

const FRAMES = [
  {
    Icon: Zap,
    step: "01",
    title: "Lead Facebook reçu.",
    body: "Votre pub tourne. Un client clique. Ses coordonnées arrivent dans LIVRA en temps réel — sans copier-coller, sans CSV.",
  },
  {
    Icon: MonitorSmartphone,
    step: "02",
    title: "Commande créée en 10 secondes.",
    body: "La confirmatrice voit le lead, confirme par appel, crée la commande directement dans le dashboard. Zéro Excel.",
  },
  {
    Icon: Users,
    step: "03",
    title: "Dispatch au livreur.",
    body: "LIVRA envoie la course au livreur disponible. Il reçoit l'adresse, l'itinéraire optimisé, le QR du colis.",
  },
  {
    Icon: MapPin,
    step: "04",
    title: "Le client voit son livreur.",
    body: "Un lien WhatsApp automatique. Le client suit son livreur en temps réel sur une carte. Plus de 'c'est pour quand ?'.",
  },
  {
    Icon: Package,
    step: "05",
    title: "Scan à la porte.",
    body: "Le livreur scanne le QR. La livraison est prouvée. Yalidine est notifié automatiquement. Preuve irréfutable.",
  },
  {
    Icon: CheckCircle,
    step: "06",
    title: "Tableau de bord en temps réel.",
    body: "Vous voyez toutes vos commandes, tous vos livreurs, tous vos taux. Prise de décision en 30 secondes.",
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
          transform: translateY(12px);
          transition: opacity 380ms ease-out, transform 380ms ease-out;
          pointer-events: none;
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .cinema-frame.active {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .cinema-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: var(--mist);
          opacity: 0.3;
          transition: opacity 300ms, background 300ms, width 300ms;
          flex-shrink: 0;
        }
        .cinema-dot.active {
          width: 20px;
          background: var(--terracotta);
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .cinema-frame {
            transition: none;
          }
        }
      `}</style>

      {/* outer: tall enough to create scroll room */}
      <div
        ref={sectionRef}
        style={{ height: `${FRAMES.length * 100}vh`, position: "relative" }}
        aria-label="Démonstration du flux LIVRA"
      >
        {/* sticky panel */}
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
              minHeight: 360,
              position: "relative",
              overflow: "hidden",
              padding: "3rem 2.5rem",
            }}
          >
            {FRAMES.map(({ Icon, step, title, body }, i) => (
              <div
                key={i}
                className={`cinema-frame${i === activeIndex ? " active" : ""}`}
                aria-hidden={i !== activeIndex}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      color: "var(--terracotta)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {step}
                  </span>
                  <Icon
                    size={28}
                    strokeWidth={1.5}
                    style={{ color: "var(--mist)" }}
                    aria-hidden="true"
                  />
                </div>
                <h3
                  style={{
                    color: "var(--ivoire)",
                    fontSize: "clamp(1.375rem, 3vw, 1.875rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    margin: "0 0 1rem",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    color: "var(--mist)",
                    fontSize: "0.9375rem",
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: 420,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>

          {/* progress dots */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginTop: "1.75rem",
            }}
            aria-hidden="true"
          >
            {FRAMES.map((_, i) => (
              <span
                key={i}
                className={`cinema-dot${i === activeIndex ? " active" : ""}`}
              />
            ))}
          </div>

          {/* scroll hint — only on first frame */}
          <p
            style={{
              color: "var(--mist)",
              fontSize: "0.75rem",
              marginTop: "1rem",
              opacity: activeIndex === 0 ? 0.6 : 0,
              transition: "opacity 400ms",
            }}
            aria-hidden="true"
          >
            Descendez pour voir la suite ↓
          </p>
        </div>
      </div>
    </>
  );
}
