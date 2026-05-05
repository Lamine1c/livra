"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const BG           = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK  = "#0c0d11";
const EMERALD      = "#076a4d";
const OFF_WHITE    = "#F5F0E8";
const MUTED        = "rgba(245,240,232,0.4)";

interface Props {
  orderId: string;
  deliveryMode: string | null;
  qrToken: string | null;
}

export function DeliveryModeSection({ orderId, deliveryMode, qrToken }: Props) {
  const [mode, setMode] = useState(deliveryMode);
  const [token, setToken] = useState(qrToken);
  const [loading, setLoading] = useState<"moto" | "cancel" | null>(null);
  const [error, setError] = useState("");

  async function handleMotoPero() {
    setError("");
    setLoading("moto");
    const res = await fetch(`/api/orders/${orderId}/generate-qr`, { method: "POST" });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) { setError(data.error ?? "Erreur"); return; }
    setToken(data.qrToken);
    setMode("moto_perso");
  }

  async function handleCancel() {
    setError("");
    setLoading("cancel");
    const res = await fetch(`/api/orders/${orderId}/generate-qr`, { method: "DELETE" });
    setLoading(null);
    if (!res.ok) { setError("Erreur lors de l'annulation"); return; }
    setToken(null);
    setMode(null);
  }

  const qrUrl = `https://golivra.app/scan?t=${token}`;

  // QR already generated — show it
  if (mode === "moto_perso" && token) {
    return (
      <div
        style={{
          background: BG,
          borderRadius: 18,
          boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
          padding: 18,
          marginBottom: 28,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 4 }}>
          QR Livreur
        </h2>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
          Montre ce QR à ton livreur. Il le scanne, c&apos;est tout.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 16,
            background: "#F5F0E8",
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <QRCodeSVG value={qrUrl} size={200} bgColor="#F5F0E8" fgColor="#1a1b1f" level="M" />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "#F87171", marginBottom: 12 }}>{error}</p>
        )}

        <button
          onClick={handleCancel}
          disabled={loading === "cancel"}
          style={{
            width: "100%",
            background: BG,
            color: MUTED,
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: `-4px -4px 8px ${SHADOW_LIGHT}, 4px 4px 8px ${SHADOW_DARK}`,
          }}
        >
          {loading === "cancel" ? "Annulation..." : "Annuler et rechoisir le mode"}
        </button>
      </div>
    );
  }

  // No delivery mode yet — show the two big buttons
  if (!mode) {
    return (
      <div
        style={{
          background: BG,
          borderRadius: 18,
          boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
          padding: 18,
          marginBottom: 28,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 4 }}>
          Mode de livraison
        </h2>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>
          Choisis comment cette commande sera livrée.
        </p>

        {error && (
          <p style={{ fontSize: 12, color: "#F87171", marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          {/* Yalidine */}
          <button
            onClick={() => alert("Intégration Yalidine — utilise le bouton Yalidine ci-dessous.")}
            style={{
              flex: 1,
              background: BG,
              color: OFF_WHITE,
              border: "1px solid rgba(245,240,232,0.1)",
              borderRadius: 14,
              padding: "16px 12px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
              lineHeight: 1.4,
              boxShadow: `-4px -4px 8px ${SHADOW_LIGHT}, 4px 4px 8px ${SHADOW_DARK}`,
            }}
          >
            🚚<br />
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 400 }}>Livraison</span>
            <br />Yalidine
          </button>

          {/* Moto perso */}
          <button
            onClick={handleMotoPero}
            disabled={loading === "moto"}
            style={{
              flex: 1,
              background: EMERALD,
              color: "#F5F0E8",
              border: "none",
              borderRadius: 14,
              padding: "16px 12px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "center",
              lineHeight: 1.4,
              boxShadow: `0 4px 16px rgba(7,106,77,0.4)`,
            }}
          >
            🏍️<br />
            <span style={{ fontSize: 12, color: "rgba(245,240,232,0.7)", fontWeight: 400 }}>
              {loading === "moto" ? "Génération..." : "J'ai mon"}
            </span>
            <br />{loading === "moto" ? "..." : "livreur"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
