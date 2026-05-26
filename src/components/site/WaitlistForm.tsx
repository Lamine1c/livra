"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Une erreur est survenue. Réessayez.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Impossible de contacter le serveur. Réessayez.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-ivoire text-base text-center py-4 font-medium">
        Vous êtes sur la liste.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-3 w-full max-w-md mx-auto"
      aria-label="Formulaire d'inscription à la liste d'attente"
      noValidate
    >
      <div className="flex-1 flex flex-col gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          aria-label="Adresse e-mail"
          aria-describedby={status === "error" ? "waitlist-error" : undefined}
          className="w-full text-ivoire text-base rounded-xl px-5 py-4 focus:outline-none disabled:opacity-50"
          style={{
            background: "var(--deep)",
            border: "var(--border-surface)",
            caretColor: "var(--terracotta)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid var(--terracotta)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "var(--border-surface)";
          }}
        />
        {status === "error" && (
          <p id="waitlist-error" className="text-coral text-sm" role="alert">
            {errorMsg}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        aria-label="Rejoindre la liste d'attente"
        className="bg-terracotta text-ivoire font-semibold rounded-[28px] px-7 py-4 whitespace-nowrap transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
        style={{
          boxShadow: "var(--shadow-btn-primary)",
          minHeight: "52px",
        }}
      >
        {status === "loading" ? (
          <span className="flex items-center gap-2" aria-live="polite">
            <svg
              className="animate-spin"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="2"
              />
              <path
                d="M14 8a6 6 0 0 0-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Envoi...
          </span>
        ) : (
          "Rejoindre la liste d'attente"
        )}
      </button>
    </form>
  );
}
