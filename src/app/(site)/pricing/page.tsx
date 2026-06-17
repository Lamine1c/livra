"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/site/Footer";
import SignupModal from "@/components/SignupModal";

type PlanKey = "founders" | "monthly";

// ── Icons (inline SVG — no emoji, brand rule) ────────────────────────────────
function FeatIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ArrowSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
  </svg>
);

// ── Features (markup identique entre les 2 cards — la teinte de la puce est
//    gérée par le sélecteur parent .pv-card--founder, cf. CSS) ───────────────
const FEATURES: { icon: React.ReactNode; label: React.ReactNode }[] = [
  { icon: <FeatIcon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></FeatIcon>, label: <><strong>Bouclier anti-scam</strong> — OTP + signal système</> },
  { icon: <FeatIcon><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></FeatIcon>, label: "Tracking GPS style Uber + partage position client par WhatsApp" },
  { icon: <FeatIcon><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" /></FeatIcon>, label: "WhatsApp automatique — confirmation, en route, livraison" },
  { icon: <FeatIcon><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></FeatIcon>, label: "Compatible avec la plupart des transporteurs nationaux" },
  { icon: <FeatIcon><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="13" y="7" width="3" height="10" /></FeatIcon>, label: "Suivi du cash en circulation" },
  { icon: <FeatIcon><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></FeatIcon>, label: "Mises à jour à vie" },
  { icon: <FeatIcon><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3zM3 19a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3z" /></FeatIcon>, label: "Support 24/7" },
];

function FeatureList() {
  return (
    <>
      <div className="pv-incl">Tout est inclus</div>
      <div className="pv-feats">
        {FEATURES.map((f, i) => (
          <div className="pv-feat" key={i}>
            <span className="ic">{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

type FoundersData = { count: number; max: number };
type FoundersState =
  | { status: "loading" }
  | { status: "ok"; count: number; max: number }
  | { status: "error" };

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [founders, setFounders] = useState<FoundersState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/founders-count")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<FoundersData>;
      })
      .then((data) => {
        if (!cancelled) setFounders({ status: "ok", count: data.count, max: data.max });
      })
      .catch(() => {
        if (!cancelled) setFounders({ status: "error" });
      });
    return () => { cancelled = true; };
  }, []);

  // Founders counter — branché sur l'API existante (même source que la v précédente)
  const foundersCount = founders.status === "ok" ? founders.count : null;
  const foundersMax = founders.status === "ok" ? founders.max : 100;
  const isFull = foundersCount !== null && foundersCount >= foundersMax;
  const remaining = foundersCount !== null ? Math.max(0, foundersMax - foundersCount) : null;

  function openModal(plan: PlanKey) {
    setSelectedPlan(plan);
    setModalOpen(true);
  }

  return (
    <>
      <style>{`
        .pv {
          --accent: var(--terracotta);
          --accent-rgb: var(--terracotta-rgb);
          --mist-dim: #6b6b70;
          --hair: rgba(255,255,255,0.07);
          --card-bd: rgba(255,255,255,0.08);
          --radius: 26px;
          position: relative; isolation: isolate; overflow: hidden;
          background: var(--onyx); color: var(--ivoire); -webkit-font-smoothing: antialiased;
        }
        .pv-hero {
          position: relative; text-align: center;
          padding: clamp(40px,7vw,80px) 24px clamp(30px,4vw,44px);
          max-width: 760px; margin: 0 auto;
        }
        .pv-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 12.5px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--mist); margin-bottom: 22px;
        }
        .pv-pip { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px 1px rgba(var(--accent-rgb),0.7); }
        .pv-h1 {
          font-weight: 800; font-size: clamp(2.3rem,6vw,3.7rem); line-height: 1.03;
          letter-spacing: -0.038em; color: var(--ivoire); text-wrap: balance;
        }
        .pv-h1 em { color: var(--terracotta); font-style: normal; }
        .pv-hero-sub {
          margin: 20px auto 0; max-width: 48ch;
          font-size: clamp(15px,1.3vw,17px); line-height: 1.6; color: var(--mist); text-wrap: pretty;
        }
        .pv-hero-sub strong { color: var(--ivoire); font-weight: 500; }

        .pv-stage { position: relative; padding: clamp(8px,2vw,20px) 20px clamp(56px,8vw,88px); }
        .pv-stage::before {
          content: ''; position: absolute; top: -4%; left: 50%; transform: translateX(-50%);
          width: min(560px,100vw); height: 580px;
          background: radial-gradient(ellipse 46% 50% at 50% 38%, rgba(var(--accent-rgb),0.13) 0%, rgba(var(--accent-rgb),0.04) 42%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .pv-grid {
          position: relative; z-index: 1; display: grid;
          grid-template-columns: repeat(2, minmax(0,380px)); gap: 22px;
          justify-content: center; align-items: stretch; max-width: 820px; margin: 0 auto;
        }

        .pv-card {
          position: relative; display: flex; flex-direction: column;
          border-radius: var(--radius); background: var(--surface); border: 1px solid var(--card-bd);
          box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 50px -30px rgba(0,0,0,0.8);
          padding: clamp(26px,2.6vw,34px) clamp(22px,2.4vw,30px) clamp(26px,2.6vw,32px);
          transition: transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
        }
        .pv-card--standard:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.14); }
        .pv-card--founder {
          background: linear-gradient(180deg, rgba(48,40,38,0.6), rgba(28,26,28,0.62)), var(--surface);
          border-color: rgba(var(--accent-rgb),0.42);
          box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 0 60px -6px rgba(var(--accent-rgb),0.16), 0 28px 64px -32px rgba(0,0,0,0.85);
          transform: translateY(-8px);
        }
        .pv-card--founder::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          border-radius: var(--radius) var(--radius) 0 0;
          background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb),0.65), transparent);
        }
        .pv-card--founder:hover {
          transform: translateY(-12px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 0 84px -6px rgba(var(--accent-rgb),0.24), 0 36px 76px -34px rgba(0,0,0,0.9);
        }

        .pv-badge {
          display: inline-flex; align-items: center; gap: 9px; align-self: flex-start;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--terracotta); background: rgba(var(--accent-rgb),0.13);
          border: 1px solid rgba(var(--accent-rgb),0.34); border-radius: 999px; padding: 7px 13px; white-space: nowrap;
        }
        .pv-badge svg { color: var(--terracotta); }
        .pv-badge .sep { width: 3px; height: 3px; border-radius: 50%; background: rgba(var(--accent-rgb),0.55); }
        .pv-badge .count { font-variant-numeric: tabular-nums; color: var(--ivoire); letter-spacing: 0.06em; }
        .pv-badge .count b { color: var(--terracotta); font-weight: 700; }
        .pv-badge .count-skel { display: inline-block; width: 64px; height: 11px; border-radius: 6px; background: rgba(255,255,255,0.12); vertical-align: middle; }

        .pv-label {
          align-self: flex-start; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--mist); border: 1px solid var(--hair); border-radius: 999px; padding: 7px 13px;
        }

        .pv-head { min-height: 168px; display: flex; flex-direction: column; }
        .pv-price { display: flex; align-items: baseline; gap: 9px; margin-top: 22px; flex-wrap: wrap; }
        .pv-strike { font-size: 18px; font-weight: 500; color: var(--mist-dim); text-decoration: line-through; text-decoration-color: rgba(var(--accent-rgb),0.6); white-space: nowrap; }
        .pv-amt { font-size: clamp(2.7rem,5vw,3.4rem); font-weight: 800; letter-spacing: -0.04em; color: var(--ivoire); line-height: 0.95; font-variant-numeric: tabular-nums; }
        .pv-per { font-size: 16px; font-weight: 500; color: var(--mist); }
        .pv-life { margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--terracotta); letter-spacing: 0.01em; }
        .pv-life svg { flex-shrink: 0; }
        .pv-life-note { margin-top: 5px; font-size: 12px; line-height: 1.45; color: var(--mist-dim); }
        .pv-standard-note { margin-top: 12px; font-size: 13px; color: var(--mist); }

        .pv-cta {
          position: relative; display: flex; align-items: center; justify-content: center; gap: 10px;
          margin-top: auto; width: 100%; padding: 16px; border-radius: 15px;
          font-size: 15.5px; font-weight: 700; letter-spacing: -0.01em;
          border: 1px solid transparent; cursor: pointer; appearance: none; font-family: inherit;
          transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease, border-color 200ms ease, filter 200ms ease;
        }
        .pv-cta--primary {
          background: var(--terracotta); color: var(--terra-deep);
          box-shadow: 0 1px 0 rgba(255,255,255,0.16) inset, 0 16px 40px -16px rgba(var(--accent-rgb),0.8);
        }
        .pv-cta--primary:hover { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset, 0 22px 50px -18px rgba(var(--accent-rgb),0.9); }
        .pv-cta--primary:disabled { opacity: 0.7; cursor: default; transform: none; filter: none; }
        .pv-cta--ghost { background: rgba(255,255,255,0.02); color: var(--ivoire); border-color: var(--card-bd); }
        .pv-cta--ghost:hover { transform: translateY(-2px); border-color: rgba(var(--accent-rgb),0.55); color: var(--ivoire); }

        .pv-incl {
          display: flex; align-items: center; gap: 12px; margin: 24px 0 18px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--mist-dim);
        }
        .pv-incl::after { content: ''; flex: 1; height: 1px; background: var(--hair); }

        .pv-feats { display: flex; flex-direction: column; gap: 13px; }
        .pv-feat { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; line-height: 1.4; color: #D8D4CC; }
        .pv-feat .ic {
          width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0; margin-top: -1px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05); color: var(--mist);
          transition: background 200ms ease, color 200ms ease;
        }
        .pv-card--founder .pv-feat .ic { background: rgba(var(--accent-rgb),0.13); color: var(--terracotta); }
        .pv-feat strong { color: var(--ivoire); font-weight: 600; }

        .pv-trust {
          position: relative; z-index: 1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
          gap: 10px 26px; max-width: 820px; margin: clamp(28px,4vw,40px) auto 0; padding: 0 24px clamp(40px,6vw,72px);
        }
        .pv-trust span { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--mist); }
        .pv-trust svg { color: var(--mist); }

        @media (prefers-reduced-motion: no-preference) {
          .pv-eyebrow, .pv-h1, .pv-hero-sub, .pv-card, .pv-trust { animation: pvrise 760ms cubic-bezier(0.22,0.61,0.36,1) backwards; }
          .pv-eyebrow { animation-delay: 40ms; }
          .pv-h1 { animation-delay: 110ms; }
          .pv-hero-sub { animation-delay: 200ms; }
          .pv-card--founder { animation-delay: 300ms; animation-name: pvrise-founder; }
          .pv-card--standard { animation-delay: 380ms; }
          .pv-trust { animation-delay: 460ms; }
          @keyframes pvrise-founder { from { transform: translateY(24px); } to { transform: translateY(-8px); } }
        }
        @keyframes pvrise { from { transform: translateY(24px); } to { transform: none; } }

        @media (max-width: 1080px) {
          .pv-grid { grid-template-columns: minmax(0,420px); }
          .pv-card--founder { transform: translateY(0); order: -1; }
          .pv-card--founder:hover { transform: translateY(-4px); }
          .pv-head { min-height: 0; }
          @media (prefers-reduced-motion: no-preference) {
            @keyframes pvrise-founder { from { transform: translateY(24px); } to { transform: translateY(0); } }
          }
        }
      `}</style>

      <main className="pv">
        {/* Hero */}
        <header className="pv-hero">
          <p className="pv-eyebrow"><span className="pv-pip" />Tarifs LIVRA</p>
          <h1 className="pv-h1">Un seul outil. <em>{"Deux façons d'y entrer."}</em></h1>
          <p className="pv-hero-sub">
            Tout LIVRA, sans piège ni engagement.<br />
            <strong>7 jours gratuits, sans carte requise.</strong>
          </p>
        </header>

        {/* Cards */}
        <section className="pv-stage">
          <div className="pv-grid">

            {/* ═══ FONDATEUR ═══ */}
            <article className="pv-card pv-card--founder">
              <div className="pv-head">
                <span className="pv-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.12" />
                  </svg>
                  Fondateur
                  {founders.status === "loading" && (
                    <>
                      <span className="sep" />
                      <span className="count-skel" aria-hidden="true" />
                    </>
                  )}
                  {founders.status === "ok" && !isFull && (
                    <>
                      <span className="sep" />
                      <span className="count"><b>{remaining}</b> / {foundersMax} places</span>
                    </>
                  )}
                  {founders.status === "ok" && isFull && (
                    <>
                      <span className="sep" />
                      <span className="count">Complet</span>
                    </>
                  )}
                </span>

                <div className="pv-price">
                  <span className="pv-strike">1 999</span>
                  <span className="pv-amt">499</span>
                  <span className="pv-per">DA / mois</span>
                </div>
                <p className="pv-life">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
                  </svg>
                  À vie
                </p>
                <p className="pv-life-note">{"tant que l'abonnement reste actif"}</p>
              </div>

              {isFull ? (
                <button type="button" className="pv-cta pv-cta--ghost" onClick={() => openModal("monthly")}>
                  Passer au Standard
                  <ArrowSvg />
                </button>
              ) : (
                <button
                  type="button"
                  className="pv-cta pv-cta--primary"
                  onClick={() => openModal("founders")}
                  disabled={founders.status === "loading"}
                >
                  Devenir Fondateur
                  <ArrowSvg />
                </button>
              )}

              <FeatureList />
            </article>

            {/* ═══ STANDARD ═══ */}
            <article className="pv-card pv-card--standard">
              <div className="pv-head">
                <span className="pv-label">Standard</span>

                <div className="pv-price">
                  <span className="pv-amt">999</span>
                  <span className="pv-per">DA / mois</span>
                </div>
                <p className="pv-standard-note">Sans engagement. Annulation en 1 clic.</p>
              </div>

              <button type="button" className="pv-cta pv-cta--ghost" onClick={() => openModal("monthly")}>
                Commencer gratuitement
                <ArrowSvg />
              </button>

              <FeatureList />
            </article>

          </div>

          {/* Trust line */}
          <div className="pv-trust">
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Paiement sécurisé
            </span>
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
              Données chiffrées
            </span>
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /></svg>
              Annulation en 1 clic
            </span>
          </div>
        </section>
      </main>

      <Footer />

      <SignupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedPlan={selectedPlan ?? "monthly"}
      />
    </>
  );
}
