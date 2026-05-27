const ROW1 = [
  "rani mkhrob, rani n'gérer f sbitar",
  "Copier-coller Facebook vers Excel, rassi tbloqua",
  "Klana l'retour, rani nkhdem ghir 3la jal les frais",
  "Krahna men colis en instance",
  "krahna had la jungle",
  "Yalidine t'khallas fihom ghali",
];

const ROW2 = [
  "Sl3a t93ad 15 jours bch t'rajja3li, t'mout",
  "rassi tbloqua ya khawti",
  "Meta takol f l'budget",
  "Traba7 livreur, y'khssar m3ak client",
  "rani n'fakar n'gla9 had la page",
  "chb3t krah fi liyyam",
];

function Track({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const renderItems = (prefix: string) =>
    items.map((item, i) => (
      <span key={`${prefix}-${i}`} className="marquee-item">
        <span className="marquee-dot" aria-hidden="true">·</span>
        {item}
      </span>
    ));

  return (
    <div className="marquee-outer" aria-hidden="true">
      <div className={`marquee-track${reverse ? " marquee-reverse" : ""}`}>
        {renderItems("a")}
        {renderItems("b")}
      </div>
    </div>
  );
}

export default function PainMarquee() {
  return (
    <>
      <style>{`
        .marquee-outer {
          overflow: hidden;
          width: 100%;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-left 50s linear infinite;
          font-size: 0.9375rem;
          color: var(--mist);
          font-family: var(--font-inter), system-ui, sans-serif;
        }
        .marquee-reverse {
          animation-name: marquee-right;
          animation-duration: 58s;
        }
        .marquee-outer:hover .marquee-track {
          animation-play-state: paused;
        }
        .marquee-item {
          white-space: nowrap;
          padding-right: 2.5rem;
        }
        .marquee-dot {
          color: var(--terracotta);
          margin-right: 0.75rem;
        }
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", overflow: "hidden" }}>
        <Track items={ROW1} />
        <Track items={ROW2} reverse />
      </div>
    </>
  );
}
