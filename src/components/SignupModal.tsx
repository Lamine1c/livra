"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { WILAYAS } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: "founders" | "monthly" | "annual";
}

interface FormState {
  fullName: string;
  email: string;
  whatsapp: string;
  boutique: string;
  wilaya: string;
  produit: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  founders: "Fondateur · 1 999 DA/mois À VIE",
  monthly: "Mensuel · 2 799 DA/mois",
  annual: "Annuel · 27 990 DA/an",
};

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  whatsapp: "",
  boutique: "",
  wilaya: "",
  produit: "",
};

const CARD_SHADOW_LG = "0 1px 0 rgba(255,255,255,0.05) inset, 0 30px 70px -34px rgba(0,0,0,0.85)";
const BTN_SHADOW = "0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 12px rgba(168,71,43,0.25)";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): { pct: number; label: string } {
  if (!pw) return { pct: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Faible", "Moyen", "Bon", "Fort", "Très fort"];
  return { pct: Math.round((score / 5) * 100), label: labels[score] ?? "Fort" };
}

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

const CaretSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function SignupModal({ isOpen, onClose, selectedPlan }: SignupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 form
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Step 2 OTP
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);

  // Step 3 password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ── Reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
      setForm(EMPTY_FORM);
      setOtp(["", "", "", "", "", ""]);
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setOtpError("");
    }
  }, [isOpen]);

  // ── Resend timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    setCanResend(false);
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const validateStep1 = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Requis";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide";
    if (!form.whatsapp.trim() || !/^\d{9}$/.test(form.whatsapp)) errs.whatsapp = "9 chiffres requis";
    if (!form.boutique.trim()) errs.boutique = "Requis";
    if (!form.wilaya) errs.wilaya = "Requis";
    if (!form.produit.trim()) errs.produit = "Requis";
    return errs;
  };

  const handleStep1Submit = async () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    console.log("[SignupModal] Step1 submit", { ...form, plan: selectedPlan });
    await new Promise<void>((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep(2);
  };

  const updateField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const handleOtpAutoSubmit = async (digits: string[]) => {
    const code = digits.join("");
    setLoading(true);
    setOtpError("");
    await new Promise<void>((r) => setTimeout(r, 800));
    setLoading(false);
    if (code === "123456") {
      setStep(3);
    } else {
      setOtpError("Code incorrect. Pour tester : 123456");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.join("").length === 6) handleOtpAutoSubmit(next);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setStep(1);
    setTimeout(() => setStep(2), 0);
  };

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  const handleStep3Submit = async () => {
    if (password.length < 8) { setPasswordError("8 caractères minimum"); return; }
    if (password !== confirmPassword) { setPasswordError("Les mots de passe ne correspondent pas"); return; }
    setPasswordError("");
    setLoading(true);
    console.log("[SignupModal] Account created", { email: form.email, plan: selectedPlan });
    await new Promise<void>((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep(4);
  };

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const pwStrength = getPasswordStrength(password);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes scaleIn{from{transform:scale(0.5);opacity:0;}to{transform:scale(1);opacity:1;}}
        .su-input:focus{border-color:rgba(217,119,87,0.55)!important;}
        .su-btn-outline:hover{border-color:var(--terracotta)!important;transform:translateY(-2px);}
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

          {/* Stepper */}
          <div style={{ display: "flex", gap: "7px", marginBottom: "22px" }}>
            {([1, 2, 3, 4] as const).map((s) => (
              <div
                key={s}
                style={{
                  flex: 1, height: "4px", borderRadius: "9999px",
                  background: s <= step ? "#D97757" : "rgba(255,255,255,0.07)",
                  boxShadow: s === step ? "0 0 10px 0 rgba(217,119,87,0.5)" : "none",
                  transition: "background .3s, box-shadow .3s",
                }}
              />
            ))}
          </div>

          {/* Plan badge */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "20px",
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#D97757", background: "rgba(217,119,87,0.12)", border: "1px solid rgba(217,119,87,0.3)",
            padding: "7px 13px", borderRadius: "9999px", whiteSpace: "nowrap", alignSelf: "flex-start",
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
            {PLAN_LABELS[selectedPlan]}
          </span>

          {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em", color: "#F5F0E8", lineHeight: "1.1" }}>
                  Crée ton compte LIVRA
                </h2>
                <p style={{ marginTop: "8px", fontSize: "14px", color: "#8A8A8E", lineHeight: "1.5" }}>
                  C'est rapide. 1 minute max.
                </p>
              </div>

              {/* Nom complet */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Nom complet</label>
                <input className="su-input" type="text" autoComplete="name" placeholder="Mohamed Amine" value={form.fullName} onChange={updateField("fullName")} style={inputStyle} />
                {errors.fullName && <span className="text-xs text-red-400">{errors.fullName}</span>}
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Email</label>
                <input className="su-input" type="email" inputMode="email" autoComplete="email" placeholder="toi@exemple.com" value={form.email} onChange={updateField("email")} style={inputStyle} />
                {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
              </div>

              {/* WhatsApp */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>WhatsApp</label>
                <div style={{ display: "flex", alignItems: "stretch", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0A0A0C" }}>
                  <span style={{ display: "flex", alignItems: "center", padding: "0 13px", fontSize: "14.5px", fontWeight: 600, color: "#F5F0E8", background: "rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                    +213
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="6XXXXXXXX"
                    value={form.whatsapp}
                    onChange={updateField("whatsapp")}
                    style={{ flex: 1, minWidth: 0, padding: "13px 14px", background: "transparent", border: "none", color: "#F5F0E8", fontSize: "14.5px", letterSpacing: "0.04em", outline: "none" }}
                  />
                </div>
                {errors.whatsapp && <span className="text-xs text-red-400">{errors.whatsapp}</span>}
              </div>

              {/* Nom de boutique */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Nom de ta boutique</label>
                <input className="su-input" type="text" placeholder="Boutique Atlas" value={form.boutique} onChange={updateField("boutique")} style={inputStyle} />
                {errors.boutique && <span className="text-xs text-red-400">{errors.boutique}</span>}
              </div>

              {/* Wilaya */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Wilaya</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.wilaya}
                    onChange={updateField("wilaya")}
                    style={{ ...inputStyle, appearance: "none", paddingRight: "38px", cursor: "pointer" }}
                  >
                    <option value="">Choisir une wilaya</option>
                    {Object.entries(WILAYAS).map(([code, name]) => (
                      <option key={code} value={code}>{code} — {name}</option>
                    ))}
                  </select>
                  <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#8A8A8E" }}>
                    <CaretSvg />
                  </span>
                </div>
                {errors.wilaya && <span className="text-xs text-red-400">{errors.wilaya}</span>}
              </div>

              {/* Produit vendu */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Produit vendu</label>
                <input className="su-input" type="text" placeholder="Casques & écouteurs" value={form.produit} onChange={updateField("produit")} style={inputStyle} />
                {errors.produit && <span className="text-xs text-red-400">{errors.produit}</span>}
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleStep1Submit}
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
                {loading ? "Chargement..." : "Recevoir mon code par email"}
              </button>
            </div>
          )}

          {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em", color: "#F5F0E8", lineHeight: "1.1" }}>
                  Vérifie ton email
                </h2>
                <p style={{ marginTop: "8px", fontSize: "14px", color: "#8A8A8E", lineHeight: "1.5" }}>
                  Code envoyé à {form.email}
                </p>
              </div>

              {/* OTP inputs */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "13px 0 4px" }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={loading}
                    aria-label={`Chiffre ${i + 1} du code`}
                    style={{
                      width: "56px", height: "56px",
                      background: "#0A0A0C",
                      border: `1px solid ${digit ? "#D97757" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "14px",
                      fontSize: "24px", fontWeight: 800,
                      color: "#F5F0E8", textAlign: "center" as const,
                      fontVariantNumeric: "tabular-nums",
                      outline: "none",
                      boxShadow: digit ? "0 0 0 3px rgba(217,119,87,0.14)" : "none",
                      transition: "border-color .15s, box-shadow .15s",
                    }}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>

              {otpError && <p className="text-xs text-red-400 text-center" role="alert">{otpError}</p>}
              {loading && <p className="text-xs text-center" aria-live="polite" style={{ color: "#8A8A8E" }}>Vérification…</p>}

              {/* Resend */}
              <p style={{ marginTop: "7px", textAlign: "center", fontSize: "13px", color: "#8A8A8E" }}>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{ color: "#8A8A8E", textDecoration: "underline", textUnderlineOffset: "3px", opacity: 0.85, cursor: "pointer", background: "none", border: "none" }}
                  >
                    Renvoyer le code
                  </button>
                ) : (
                  <span>Renvoyer le code (dans {resendTimer}s)</span>
                )}
              </p>

              <button
                type="button"
                disabled
                style={{
                  appearance: "none", cursor: "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: "16px", borderRadius: "14px", marginTop: "2px",
                  fontSize: "15px", fontWeight: 600,
                  background: "rgba(255,255,255,0.05)", color: "#8A8A8E",
                  border: "none", boxShadow: "none",
                }}
              >
                Vérifier
              </button>
            </div>
          )}

          {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em", color: "#F5F0E8", lineHeight: "1.1" }}>
                  Crée ton mot de passe
                </h2>
                <p style={{ marginTop: "8px", fontSize: "14px", color: "#8A8A8E", lineHeight: "1.5" }}>
                  Minimum 8 caractères.
                </p>
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Mot de passe</label>
                <input
                  className="su-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                  style={inputStyle}
                />
              </div>

              {/* Confirm password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={labelStyle}>Confirme le mot de passe</label>
                <input
                  className="su-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                  style={inputStyle}
                />
              </div>

              {/* Password strength meter */}
              {password && (
                <div style={{ marginTop: "14px" }}>
                  <div style={{ height: "5px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${pwStrength.pct}%`,
                      borderRadius: "9999px",
                      background: "#D97757",
                      boxShadow: "0 0 8px 0 rgba(217,119,87,0.5)",
                      transition: "width .3s ease",
                    }} />
                  </div>
                  {pwStrength.label && (
                    <span style={{ display: "block", marginTop: "8px", fontSize: "11.5px", color: "#8A8A8E", letterSpacing: "0.02em" }}>
                      Force du mot de passe : {pwStrength.label}
                    </span>
                  )}
                </div>
              )}

              {passwordError && <p className="text-xs text-red-400" role="alert">{passwordError}</p>}

              <button
                type="button"
                disabled={loading}
                onClick={handleStep3Submit}
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
                {loading ? "Chargement..." : "Créer mon compte"}
              </button>
            </div>
          )}

          {/* ── STEP 4 ─────────────────────────────────────────────────────── */}
          {step === 4 && (
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
                Bienvenue chez LIVRA
              </h2>
              <p style={{ marginTop: "10px", fontSize: "14px", color: "#8A8A8E", lineHeight: "1.5" }}>
                Ton compte est créé. Tu vas recevoir un email avec tes accès.
              </p>
              <Link
                href="/telecharger"
                onClick={onClose}
                className="su-btn-primary"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: "16px", borderRadius: "14px", marginTop: "26px",
                  fontSize: "15px", fontWeight: 700, letterSpacing: "-0.005em",
                  background: "#D97757", color: "#1a0f0a",
                  boxShadow: BTN_SHADOW, textDecoration: "none",
                  transition: "transform .2s ease, filter .2s ease",
                }}
              >
                Voir où télécharger
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
