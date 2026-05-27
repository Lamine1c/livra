"use client";

import { useEffect, useRef } from "react";

const BUBBLES = [
  {
    from: "client",
    name: "Ahmed Drop",
    avatarColor: "var(--terracotta)",
    text: "H24 connecté sur Messenger, tgoul rani nakhdem f central téléphonique",
    time: "il y a 2h",
  },
  {
    from: "client",
    name: "Boutique El Jadida",
    avatarColor: "var(--ambre)",
    text: "T3ayatlo 5 fois ma yrépondich, ki t'annuler y9olk « 3lah ma jbtouhlich ? »",
    time: "il y a 4h",
  },
  {
    from: "client",
    name: "Sara Fashion DZ",
    avatarColor: "var(--sapin)",
    text: "L'livreur y3ayatlo ghir mara whda, ma yrépondich y9olo « retour »",
    time: "il y a 6h",
  },
  {
    from: "client",
    name: "Imad Ecom",
    avatarColor: "var(--coral)",
    text: "L'tracking y9ol « en cours », w l'livreur y9oli « dfa3to l'barah »",
    time: "il y a 8h",
  },
  {
    from: "client",
    name: "Yasmine Boutique",
    avatarColor: "var(--terracotta)",
    text: "Le retour ya khouti y'koul l'bénéfice ta3 3 commandes livrées",
    time: "hier",
  },
  {
    from: "client",
    name: "Karim Stock",
    avatarColor: "var(--mist)",
    text: "Un lead Meta à 2$, pour qu'à la fin il te dise « bch7al hada ? »",
    time: "hier",
  },
  {
    from: "client",
    name: "Selma Mode",
    avatarColor: "var(--ambre)",
    text: "L'client y3ayatli lya y9oli « winraho l'colis ? », wana rani f l'dlam",
    time: "hier",
  },
  {
    from: "client",
    name: "Reda E-shop",
    avatarColor: "var(--sapin)",
    text: "30% de retour, hada machi business, hada rah tmaskhir b nass",
    time: "il y a 2 jours",
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
              Conversations e-commerçants DZ
            </p>
            <p
              style={{
                color: "var(--mist)",
                fontSize: "0.6875rem",
                margin: 0,
              }}
            >
              Groupe Facebook · 12 400 membres
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
          Vous vous reconnaissez ?
        </p>
      </div>
    </>
  );
}
