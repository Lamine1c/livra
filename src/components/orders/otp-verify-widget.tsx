"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OtpVerifyWidgetProps {
  orderId: string;
  clientPhone: string;
  clientName: string;
}

type Phase = "sending" | "input" | "error" | "verified";

export function OtpVerifyWidget({
  orderId,
  clientPhone,
  clientName,
}: OtpVerifyWidgetProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("sending");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    sendOtp();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function sendOtp() {
    setPhase("sending");
    setErrorMsg("");
    const res = await fetch(`/api/orders/${orderId}/send-otp`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setPhase("error");
      setErrorMsg(data.error ?? "Échec de l'envoi WhatsApp");
      return;
    }
    setMaskedPhone(data.maskedPhone);
    setPhase("input");
    setResendCooldown(60);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length !== 6) return;
    setVerifying(true);
    setErrorMsg("");

    const res = await fetch(`/api/orders/${orderId}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Code incorrect");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      setVerifying(false);
      return;
    }

    setPhase("verified");
    setTimeout(() => router.refresh(), 800);
  }

  const code = digits.join("");

  if (phase === "verified") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className="font-semibold text-gray-900">Commande confirmée !</p>
        <p className="text-sm text-gray-500">Le statut a été mis à jour.</p>
      </div>
    );
  }

  if (phase === "sending") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm">Envoi du code WhatsApp à {clientName}…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <MessageCircle className="h-8 w-8 text-red-400" />
        <div>
          <p className="font-medium text-gray-900">Échec de l'envoi</p>
          <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
        </div>
        <Button variant="outline" onClick={sendOtp}>
          <RotateCcw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <MessageCircle className="h-5 w-5" />
        </div>
        <p className="mt-2 font-medium text-gray-900">
          Code envoyé par WhatsApp
        </p>
        <p className="text-sm text-gray-500">
          Un code à 6 chiffres a été envoyé au{" "}
          <span className="font-mono font-medium text-gray-700">
            {maskedPhone}
          </span>
        </p>
      </div>

      {/* 6 digit inputs */}
      <div className="flex gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-10 rounded-lg border border-gray-300 bg-white text-center text-xl font-bold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        ))}
      </div>

      {errorMsg && (
        <p className="text-sm font-medium text-red-600">{errorMsg}</p>
      )}

      <Button
        onClick={handleVerify}
        disabled={code.length !== 6 || verifying}
        className="w-full max-w-xs"
      >
        {verifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Vérification…
          </>
        ) : (
          "Confirmer la commande"
        )}
      </Button>

      <button
        onClick={sendOtp}
        disabled={resendCooldown > 0}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {resendCooldown > 0
          ? `Renvoyer dans ${resendCooldown}s`
          : "Renvoyer le code"}
      </button>
    </div>
  );
}
