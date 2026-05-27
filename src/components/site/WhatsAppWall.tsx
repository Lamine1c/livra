"use client";

import { useEffect, useRef } from "react";

const BUBBLES = [
  {
    from: "client",
    name: "Rania B.",
    avatarColor: "var(--terracotta)",
    text: "Bonjour j'ai commandé hier, il est où mon colis ?",
    time: "09:14",
  },
  {
    from: "vendor",
    name: "Vous",
    avatarColor: "var(--sapin)",
    text: "Bonjour ! Je vérifie… 🙏",
    time: "09:31",
  },
  {
    from: "client",
    name: "Younes K.",
    avatarColor: "var(--ambre)",
    text: "J'attends depuis 3 jours, personne répond",
    time: "10:02",
  },
  {
    from: "client",
    name: "Sarah M.",
    avatarColor: "var(--coral)",
    text: "Le livreur est passé, j'étais là, il a pas sonné",
    time: "10:45",
  },
  {
    from: "vendor",
    name: "Vous",
    avatarColor: "var(--sapin)",
    text: "Désolé… je rappelle le livreur",
    time: "10:58",
  },
  {
    from: "client",
    name: "Karim D.",
    avatarColor: "var(--mist)",
    text: "RETOURNÉ encore une fois ??? Sérieux ???",
    time: "14:20",
  },
  {
    from: "client",
    name: "Nadia T.",
    avatarColor: "var(--terracotta)",
    text: "5ème appel. Yalidine dit que c'est vous, vous dites c'est eux",
    time: "15:33",
  },
  {
    from: "vendor",
    name: "Vous",
    avatarColor: "var(--sapin)",
    text: "… je suis désolé, on règle ça demain",
    time: "18:41",
  },
];

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: "var(--ivoire)",
        opacity: 0.85,
      }}
    >
      {name.charAt(0)}
    </span>
  );
}

export default function WhatsAppWall() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = containerRef.current?.querySelectorAll<HTMLElement>(".wa-bubble");
    if (!items) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach((el, i) => {
      el.style.transitionDelay = `${i * 90}ms`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .wa-bubble {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 420ms ease-out, transform 420ms ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-bubble {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          background: "var(--deep)",
          borderRadius: "24px",
          padding: "1.5rem 1.25rem",
          border: "var(--border-surface)",
          boxShadow: "var(--shadow-card)",
          maxWidth: 480,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
        }}
      >
        {/* WA header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            borderBottom: "var(--border-faint)",
            paddingBottom: "0.875rem",
            marginBottom: "0.25rem",
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
            }}
            aria-hidden="true"
          >
            📦
          </span>
          <div>
            <p
              style={{
                color: "var(--ivoire)",
                fontSize: "0.875rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Mon e-commerce
            </p>
            <p
              style={{
                color: "var(--mist)",
                fontSize: "0.6875rem",
                margin: 0,
              }}
            >
              Groupe WhatsApp · 47 membres
            </p>
          </div>
        </div>

        {BUBBLES.map((b, i) => {
          const isVendor = b.from === "vendor";
          return (
            <div
              key={i}
              className="wa-bubble"
              style={{
                display: "flex",
                flexDirection: isVendor ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: "0.5rem",
              }}
            >
              {!isVendor && (
                <Avatar name={b.name} color={b.avatarColor} />
              )}
              <div
                style={{
                  maxWidth: "72%",
                  background: isVendor ? "var(--surface)" : "rgba(255,255,255,0.05)",
                  borderRadius: isVendor
                    ? "16px 4px 16px 16px"
                    : "4px 16px 16px 16px",
                  padding: "0.5rem 0.75rem",
                  border: "var(--border-faint)",
                }}
              >
                {!isVendor && (
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: b.avatarColor,
                      margin: "0 0 2px",
                    }}
                  >
                    {b.name}
                  </p>
                )}
                <p
                  style={{
                    color: "var(--ivoire)",
                    fontSize: "0.8125rem",
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {b.text}
                </p>
                <p
                  style={{
                    color: "var(--mist)",
                    fontSize: "0.625rem",
                    margin: "4px 0 0",
                    textAlign: "right",
                  }}
                >
                  {b.time}
                </p>
              </div>
              {isVendor && (
                <Avatar name={b.name} color={b.avatarColor} />
              )}
            </div>
          );
        })}

        {/* "ça suffit" caption */}
        <p
          style={{
            textAlign: "center",
            color: "var(--mist)",
            fontSize: "0.75rem",
            marginTop: "0.5rem",
            fontStyle: "italic",
          }}
        >
          Votre quotidien avant LIVRA.
        </p>
      </div>
    </>
  );
}
