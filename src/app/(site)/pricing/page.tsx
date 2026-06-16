"use client";

import { useState, useEffect } from "react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SignupModal from "@/components/SignupModal";

type PlanKey = "founders" | "monthly" | "annual";

const BTN_SHADOW = "0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 12px rgba(168,71,43,0.25)";

const CheckSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

function FeatItem({ variant, children }: { variant: "terra" | "mist"; children: React.ReactNode }) {
  const isTerra = variant === "terra";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "11px", fontSize: "14px", lineHeight: "1.4", color: "#D2CEC6" }}>
      <span style={{
        width: "20px", height: "20px", flexShrink: 0, marginTop: "1px",
        display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%",
        color: isTerra ? "#D97757" : "#8A8A8E",
        background: isTerra ? "rgba(217,119,87,0.14)" : "rgba(255,255,255,0.06)",
      }}>
        <CheckSvg />
      </span>
      <span>{children}</span>
    </div>
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

  // Derived values for the founders card
  const foundersCount = founders.status === "ok" ? founders.count : null;
  const foundersMax = founders.status === "ok" ? founders.max : 100;
  const isFull = foundersCount !== null && foundersCount >= foundersMax;
  const remaining = foundersCount !== null ? Math.max(0, foundersMax - foundersCount) : null;
  const barWidth = foundersCount !== null ? `${Math.min(100, (foundersCount / foundersMax) * 100)}%` : "17%";
  const barColor = foundersCount !== null && foundersCount >= 80 ? "#F59E0B" : "#D97757";
  const barGlow = foundersCount !== null && foundersCount >= 80
    ? "0 0 10px 0 rgba(245,158,11,0.7)"
    : "0 0 10px 0 rgba(217,119,87,0.7)";
  const counterColor = foundersCount !== null && foundersCount >= 80 ? "#F59E0B" : "#E0A340";

  function openModal(plan: PlanKey) {
    setSelectedPlan(plan);
    setModalOpen(true);
  }

  return (
    <>
      <style>{`
        @keyframes counterPulse{0%,100%{box-shadow:0 0 8px 0 rgba(224,163,64,0.45);}50%{box-shadow:0 0 16px 1px rgba(224,163,64,0.8);}}
        @media(prefers-reduced-motion:reduce){.counter-bar-fill{animation:none!important;}}
        .pr-grid{display:flex;justify-content:center;align-items:center;gap:24px;max-width:1140px;margin:0 auto;padding:0 24px;}
        .pcard-side{flex:0 0 332px;z-index:2;}
        .pcard-hl{flex:0 0 380px;z-index:1;}
        .pcard-side:hover,.pcard-hl:hover{transform:translateY(-4px);}
        @media(max-width:980px){
          .pr-grid{flex-direction:column;max-width:440px;}
          .pcard-side,.pcard-hl{flex:0 0 auto;width:100%;}
          .pcard-hl{order:-1;}
        }
      `}</style>

      <Header />

      <main style={{ background: "#0E0E10", position: "relative", isolation: "isolate", overflow: "hidden" }}>
        {/* Radial terracotta glow */}
        <div aria-hidden="true" style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "min(900px,130vw)", height: "680px",
          background: "radial-gradient(ellipse 50% 50% at 50% 40%, rgba(217,119,87,0.10) 0%, rgba(217,119,87,0.03) 42%, transparent 68%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Hero */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "760px", margin: "0 auto", padding: "clamp(48px,7vw,88px) 24px clamp(40px,5vw,60px)" }}>
          <p style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontSize: "12.5px", fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A8A8E", marginBottom: "22px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D97757", boxShadow: "0 0 12px 1px rgba(217,119,87,0.7)", flexShrink: 0 }} />
            Tarifs LIVRA
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(40px,6vw,64px)", lineHeight: "1.02", letterSpacing: "-0.035em", color: "#F5F0E8" }}>
            Choisissez votre plan
          </h1>
          <p style={{ margin: "20px auto 0", maxWidth: "48ch", fontSize: "clamp(15px,1.3vw,17px)", lineHeight: "1.6", color: "#8A8A8E" }}>
            7 jours gratuits. Sans engagement. Annulable en 1 clic.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="pr-grid" style={{ position: "relative", zIndex: 1 }}>

          {/* MENSUEL */}
          <article className="pcard-side" style={{
            display: "flex", flexDirection: "column",
            background: "rgba(38,40,50,0.55)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px",
            padding: "32px 28px 30px",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.4)",
            transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8E", marginTop: "22px" }}>Mensuel</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "10px", flexWrap: "wrap" as const }}>
              <span style={{ fontSize: "clamp(32px,3.4vw,42px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, color: "#F5F0E8", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                2 799 DA
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#8A8A8E" }}>/ mois</span>
            </div>
            <p style={{ marginTop: "11px", fontSize: "13px", color: "#8A8A8E", lineHeight: "1.5" }}>Sans engagement</p>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "24px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "13px", flex: 1 }}>
              <FeatItem variant="mist">7 jours gratuits</FeatItem>
              <FeatItem variant="mist">Toutes les fonctionnalités LIVRA</FeatItem>
              <FeatItem variant="mist">Annulable à tout moment</FeatItem>
            </div>
            <div style={{ marginTop: "26px" }}>
              <button
                type="button"
                onClick={() => openModal("monthly")}
                style={{
                  appearance: "none", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: "16px", borderRadius: "14px",
                  fontSize: "15px", fontWeight: 600, letterSpacing: "-0.005em",
                  background: "rgba(255,255,255,0.02)", color: "#F5F0E8",
                  transition: "transform .2s ease, border-color .2s ease",
                }}
              >
                Commencer mensuel
              </button>
            </div>
          </article>

          {/* FONDATEUR */}
          <article className="pcard-hl" style={{
            position: "relative",
            display: "flex", flexDirection: "column",
            background: "linear-gradient(180deg, rgba(48,40,38,0.62), rgba(30,28,30,0.58))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(217,119,87,0.4)", borderRadius: "24px",
            padding: "36px 30px 34px",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.4), 0 0 50px rgba(217,119,87,0.08)",
            transition: "transform .25s ease, box-shadow .25s ease",
          }}>
            {/* top hairline */}
            <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(217,119,87,0.6),transparent)" }} />

            {/* pill */}
            <span style={{
              alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "7px",
              fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "6px 12px", borderRadius: "9999px", whiteSpace: "nowrap",
              color: "#D97757", background: "rgba(217,119,87,0.14)", border: "1px solid rgba(217,119,87,0.32)",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor" }} />
              Exclusif · 100 premiers
            </span>

            {/* scarcity counter */}
            <div style={{ marginTop: "14px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: counterColor, display: "flex", alignItems: "center", gap: "9px" }}>
              {founders.status === "loading" ? (
                <span style={{ whiteSpace: "nowrap", color: "#8A8A8E", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                  <span style={{ display: "inline-block", width: "110px", height: "12px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", verticalAlign: "middle" }} />
                </span>
              ) : founders.status === "error" ? (
                <span style={{ whiteSpace: "nowrap", color: "#8A8A8E", fontWeight: 500, textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>Places limitées</span>
              ) : isFull ? (
                <span style={{ whiteSpace: "nowrap", color: "#D97757" }}>COMPLET</span>
              ) : (
                <span style={{ whiteSpace: "nowrap" }}>PLUS QUE {remaining} PLACE{remaining === 1 ? "" : "S"}</span>
              )}
              {founders.status === "ok" && !isFull && (
                <span style={{ flex: 1, height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", overflow: "hidden", maxWidth: "120px", display: "block" }}>
                  <i className="counter-bar-fill" style={{ display: "block", height: "100%", width: barWidth, borderRadius: "9999px", background: barColor, boxShadow: barGlow, animation: "counterPulse 2.2s ease-in-out infinite" }} />
                </span>
              )}
            </div>

            <div style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8E", marginTop: "18px" }}>Fondateur</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "10px", flexWrap: "wrap" as const }}>
              <span style={{ fontSize: "clamp(38px,4vw,50px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, color: "#F5F0E8", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                1 999 DA
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#8A8A8E" }}>
                / mois <b style={{ color: "#D97757", fontWeight: 700 }}>À VIE</b>
              </span>
            </div>
            <p style={{ marginTop: "11px", fontSize: "13px", color: "#8A8A8E", lineHeight: "1.5" }}>Prix verrouillé pour toujours.</p>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "24px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "13px", flex: 1 }}>
              <FeatItem variant="terra">7 jours gratuits</FeatItem>
              <FeatItem variant="terra">Toutes les fonctionnalités LIVRA</FeatItem>
              <FeatItem variant="terra"><strong style={{ color: "#F5F0E8", fontWeight: 600 }}>Prix verrouillé À VIE</strong></FeatItem>
              <FeatItem variant="terra">Support prioritaire</FeatItem>
              <FeatItem variant="terra">Badge <strong style={{ color: "#F5F0E8", fontWeight: 600 }}>« Fondateur »</strong> dans ton compte</FeatItem>
            </div>
            <div style={{ marginTop: "26px" }}>
              {isFull ? (
                <button
                  type="button"
                  onClick={() => openModal("monthly")}
                  style={{
                    appearance: "none", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", padding: "16px", borderRadius: "14px",
                    fontSize: "15px", fontWeight: 600, letterSpacing: "-0.005em",
                    background: "rgba(255,255,255,0.02)", color: "#F5F0E8",
                    transition: "transform .2s ease, border-color .2s ease",
                  }}
                >
                  Passer au mensuel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openModal("founders")}
                  disabled={founders.status === "loading"}
                  style={{
                    appearance: "none", border: "none",
                    cursor: founders.status === "loading" ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", padding: "16px", borderRadius: "14px",
                    fontSize: "15px", fontWeight: 700, letterSpacing: "-0.005em",
                    background: founders.status === "loading" ? "rgba(217,119,87,0.5)" : "#D97757",
                    color: "#1a0f0a",
                    boxShadow: founders.status === "loading" ? "none" : BTN_SHADOW,
                    transition: "transform .2s ease, box-shadow .2s ease, filter .2s ease",
                    opacity: founders.status === "loading" ? 0.7 : 1,
                  }}
                >
                  Devenir fondateur
                </button>
              )}
            </div>
          </article>

          {/* ANNUEL */}
          <article className="pcard-side" style={{
            display: "flex", flexDirection: "column",
            background: "rgba(38,40,50,0.55)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px",
            padding: "32px 28px 30px",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.4)",
            transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease",
          }}>
            {/* pill */}
            <span style={{
              alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "7px",
              fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "6px 12px", borderRadius: "9999px", whiteSpace: "nowrap",
              color: "#c79077", background: "rgba(217,119,87,0.08)", border: "1px solid rgba(217,119,87,0.18)",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor" }} />
              Économise 16%
            </span>

            <div style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8E", marginTop: "22px" }}>Annuel</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "10px", flexWrap: "wrap" as const }}>
              <span style={{ fontSize: "clamp(32px,3.4vw,42px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, color: "#F5F0E8", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                27 990 DA
              </span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#8A8A8E" }}>/ an</span>
            </div>
            <p style={{ marginTop: "11px", fontSize: "13px", color: "#8A8A8E", lineHeight: "1.5" }}>
              Équivaut à 2 333 DA/mois<br />(= 2 mois offerts)
            </p>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "24px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "13px", flex: 1 }}>
              <FeatItem variant="mist">7 jours gratuits</FeatItem>
              <FeatItem variant="mist">Toutes les fonctionnalités LIVRA</FeatItem>
              <FeatItem variant="mist">2 mois offerts vs mensuel</FeatItem>
            </div>
            <div style={{ marginTop: "26px" }}>
              <button
                type="button"
                onClick={() => openModal("annual")}
                style={{
                  appearance: "none", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: "16px", borderRadius: "14px",
                  fontSize: "15px", fontWeight: 600, letterSpacing: "-0.005em",
                  background: "rgba(255,255,255,0.02)", color: "#F5F0E8",
                  transition: "transform .2s ease, border-color .2s ease",
                }}
              >
                Commencer annuel
              </button>
            </div>
          </article>

        </div>

        {/* Trust line */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "clamp(20px,3vw,40px)", flexWrap: "wrap",
          margin: "clamp(44px,5vw,64px) auto 0", maxWidth: "1000px",
          padding: "0 24px clamp(60px,8vw,100px)",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "#8A8A8E" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Paiement sécurisé
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "#8A8A8E" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Données chiffrées
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "#8A8A8E" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /></svg>
            Annulable en 1 clic
          </span>
        </div>
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
