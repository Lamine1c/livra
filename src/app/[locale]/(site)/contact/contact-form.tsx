"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "ok" | "error";

export default function ContactForm() {
  const t = useTranslations("Contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, role: role || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? t("errGeneric"));
        setStatus("error");
        return;
      }
      setStatus("ok");
      setName("");
      setEmail("");
      setRole("");
      setMessage("");
    } catch {
      setErr(t("errReseau"));
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="ct-success" role="status">
        <p className="ct-success__title">{t("successTitle")}</p>
        <p className="ct-success__body">{t("successBody")}</p>
        <button type="button" className="ct-btn ct-btn--ghost" onClick={() => setStatus("idle")}>
          {t("successAutre")}
        </button>
      </div>
    );
  }

  return (
    <form className="ct-form" onSubmit={handleSubmit} noValidate>
      <label className="ct-label" htmlFor="ct-name">{t("labelNom")}</label>
      <input
        id="ct-name"
        className="ct-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={120}
        autoComplete="name"
      />

      <label className="ct-label" htmlFor="ct-email">{t("labelEmail")}</label>
      <input
        id="ct-email"
        type="email"
        className="ct-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <label className="ct-label" htmlFor="ct-role">{t("labelRole")}</label>
      <select
        id="ct-role"
        className="ct-input"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="">{t("roleDefault")}</option>
        <option value="vendeur">{t("roleVendeur")}</option>
        <option value="acheteur">{t("roleAcheteur")}</option>
        <option value="autre">{t("roleAutre")}</option>
      </select>

      <label className="ct-label" htmlFor="ct-message">{t("labelMessage")}</label>
      <textarea
        id="ct-message"
        className="ct-input ct-textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        minLength={10}
        maxLength={4000}
        rows={6}
      />

      {status === "error" && <p className="ct-error">{err}</p>}

      <button type="submit" className="ct-btn" disabled={status === "sending"}>
        {status === "sending" ? t("envoiEnCours") : t("envoyer")}
      </button>

      <style>{`
        .ct-form { display: flex; flex-direction: column; }
        .ct-label {
          font-size: 13px; color: var(--mist); margin: 14px 0 6px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .ct-label:first-child { margin-top: 0; }
        .ct-input {
          background: var(--deep); color: var(--ivoire);
          border: 1px solid var(--hair); border-radius: 12px;
          padding: 13px 16px; font-size: 15px; width: 100%;
          font-family: inherit; outline: none;
          transition: border-color .2s ease;
        }
        .ct-input:focus { border-color: var(--terracotta); }
        .ct-textarea { resize: vertical; min-height: 130px; line-height: 1.5; }
        .ct-btn {
          margin-top: 22px; align-self: flex-start;
          background: var(--terracotta); color: #0E0E10;
          border: none; border-radius: 999px;
          padding: 13px 28px; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: opacity .2s ease;
        }
        .ct-btn:hover { opacity: 0.9; }
        .ct-btn:disabled { opacity: 0.5; cursor: default; }
        .ct-btn--ghost {
          background: transparent; color: var(--ivoire);
          border: 1px solid var(--hair); margin-top: 18px;
        }
        .ct-error { color: #D17861; font-size: 14px; margin: 14px 0 0; }
        .ct-success { text-align: left; }
        .ct-success__title { color: var(--ivoire); font-size: 20px; font-weight: 700; margin: 0 0 8px; }
        .ct-success__body { color: var(--mist); font-size: 15px; margin: 0; }
      `}</style>
    </form>
  );
}
