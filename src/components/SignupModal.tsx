"use client";

import { useState, useEffect } from "react";

// ─── Waitlist Fondateur ──────────────────────────────────────────────────────
// Tant que l'app n'est pas sur les stores, /pricing n'inscrit plus personne :
// on collecte nom + WhatsApp (POST /api/waitlist) et on prévient le prospect
// sur WhatsApp le jour de l'ouverture. Le tunnel email -> OTP -> mot de passe
// est retiré (routes /api/auth/* conservées, mais plus appelées côté front).

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Format DZ local : 0 + [567] + 8 chiffres (espaces retirés avant test).
const WHATSAPP_RE = /^0[567]\d{8}$/;
const WHATSAPP_ERR = "Numéro WhatsApp invalide (ex. 05 XX XX XX XX)";

const CARD_SHADOW_LG = "0 1px 0 rgba(255,255,255,0.05) inset, 0 30px 70px -34px rgba(0,0,0,0.85)";
const BTN_SHADOW = "0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 12px rgba(168,71,43,0.25)";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  background: "#0A0A0C",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#F5F0E8",
  fontSize: "14.5px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#8A8A8E",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; whatsapp?: string; form?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  // Reset à chaque ouverture (le composant reste monté quand isOpen=false).
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset volontaire du formulaire à chaque ouverture.
      setFullName("");
      setWhatsapp("");
      setErrors({});
      setSubmitted(false);
      setLoading(false);
    }
  }, [isOpen]);

  const validate = (): { fullName?: string; whatsapp?: string } => {
    const errs: { fullName?: string; whatsapp?: string } = {};
    const name = fullName.trim();
    if (name.length < 2 || name.length > 120) errs.fullName = "Nom complet requis";
    if (!WHATSAPP_RE.test(whatsapp.replace(/\s+/g, ""))) errs.whatsapp = WHATSAPP_ERR;
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          whatsapp: whatsapp.replace(/\s+/g, ""),
        }),
      });

      if (res.ok) { setSubmitted(true); return; }

      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setErrors({ form: data?.error ?? "Trop de tentatives. Réessaie dans une heure." });
      } else if (res.status === 422) {
        setErrors({ whatsapp: WHATSAPP_ERR });
      } else {
        setErrors({ form: "Une erreur est survenue, réessaie." });
      }
    } catch {
      setErrors({ form: "Une erreur est survenue, réessaie." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes scaleIn{from{transform:scale(0.5);opacity:0;}to{transform:scale(1);opacity:1;}}
        .su-input:focus{border-color:rgba(217,119,87,0.55)!important;}
        .su-btn-primary:hover{transform:translateY(-2px);filter:brightness(1.04);}
      `}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(217,119,87,0.06), transparent 60%), rgba(10,10,12,0.85)",
          backdropFilter: "blur(20px)",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative w-full flex flex-col max-h-[90vh] overflow-y-auto"
          style={{
            background: "rgba(38,40,50,0.55)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            padding: "32px 30px",
            maxWidth: "440px",
            boxShadow: CARD_SHADOW_LG,
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-5 right-5 transition-opacity"
            style={{ color: "#8A8A8E", opacity: 0.6 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Badge Fondateur */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "18px",
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#D97757", background: "rgba(217,119,87,0.12)", border: "1px solid rgba(217,119,87,0.3)",
            padding: "7px 13px", borderRadius: "9999px", whiteSpace: "nowrap", alignSelf: "flex-start",
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
            Fondateur
          </span>

          {/* ── FORMULAIRE ──────────────────────────────────────────────────── */}
          {!submitted && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.025em", color: "#F5F0E8", lineHeight: "1.15" }}>
                  Fondateur · 499 DA/mois à vie — les 50 premières places
                </h2>
                <p style={{ marginTop: "10px", fontSize: "14px", color: "#8A8A8E", lineHeight: "1.5" }}>
                  L&apos;app arrive sur le Play Store. Laisse ton WhatsApp, tu seras prévenu le jour J — ta place est gardée.
                </p>
              </div>

              {/* Nom complet */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Nom complet</label>
                <input
                  className="su-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Mohamed Amine"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined })); }}
                  style={inputStyle}
                />
                {errors.fullName && <span className="text-xs text-red-400">{errors.fullName}</span>}
              </div>

              {/* WhatsApp */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Numéro WhatsApp</label>
                <input
                  className="su-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={16}
                  placeholder="05 XX XX XX XX"
                  value={whatsapp}
                  onChange={(e) => { setWhatsapp(e.target.value); if (errors.whatsapp) setErrors((p) => ({ ...p, whatsapp: undefined })); }}
                  style={{ ...inputStyle, letterSpacing: "0.04em" }}
                />
                {errors.whatsapp && <span className="text-xs text-red-400">{errors.whatsapp}</span>}
              </div>

              {errors.form && <p className="text-xs text-red-400" role="alert">{errors.form}</p>}

              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="su-btn-primary"
                style={{
                  appearance: "none", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: "16px", borderRadius: "14px", marginTop: "2px",
                  fontSize: "15px", fontWeight: 700, letterSpacing: "-0.005em",
                  background: "#D97757", color: "#1a0f0a",
                  boxShadow: BTN_SHADOW,
                  opacity: loading ? 0.6 : 1,
                  transition: "transform .2s ease, box-shadow .2s ease, filter .2s ease, opacity .2s",
                }}
              >
                {loading ? "Chargement..." : "Réserver ma place Fondateur"}
              </button>
            </div>
          )}

          {/* ── SUCCÈS ──────────────────────────────────────────────────────── */}
          {submitted && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div
                aria-hidden="true"
                style={{
                  width: "80px", height: "80px", margin: "8px auto 0",
                  borderRadius: "50%",
                  background: "#D97757",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#1a0f0a",
                  boxShadow: "0 0 0 8px rgba(217,119,87,0.10), 0 0 40px 0 rgba(217,119,87,0.25)",
                  animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em", color: "#F5F0E8", lineHeight: "1.1", marginTop: "26px" }}>
                C&apos;est noté !
              </h2>
              <p style={{ marginTop: "10px", fontSize: "14px", color: "#8A8A8E", lineHeight: "1.5" }}>
                On t&apos;écrit sur WhatsApp dès l&apos;ouverture.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
