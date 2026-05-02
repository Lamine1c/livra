"use client";

import { useState } from "react";

const BG = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK = "#0c0d11";
const OFF_WHITE = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.4)";

interface Props {
  orderId: string;
  driverName: string | null;
  driverPhone: string | null;
}

export function IndependentDeliveryButton({ orderId, driverName, driverPhone }: Props) {
  const [showQR, setShowQR] = useState(false);

  const isAssigned = !!driverName && !!driverPhone;

  const qrUrl = `https://golivra.app/livreur/rejoindre?order=${orderId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=1a1b1f&color=F5F0E8&margin=10`;

  if (isAssigned) {
    return (
      <div style={{
        background: BG,
        borderRadius: 12,
        padding: 16,
        boxShadow: `inset -4px -4px 8px ${SHADOW_LIGHT}, inset 4px 4px 8px ${SHADOW_DARK}`,
      }}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Livreur assigné</p>
        <p style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 600 }}>{driverName}</p>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{driverPhone}</p>
      </div>
    );
  }

  if (!showQR) {
    return (
      <button
        onClick={() => setShowQR(true)}
        style={{
          width: "100%",
          background: BG,
          color: OFF_WHITE,
          border: "none",
          borderRadius: 12,
          padding: "14px 18px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: `-4px -4px 8px ${SHADOW_LIGHT}, 4px 4px 8px ${SHADOW_DARK}`,
        }}
      >
        Assigner un livreur indépendant
      </button>
    );
  }

  return (
    <div style={{
      background: BG,
      borderRadius: 12,
      padding: 16,
      boxShadow: `inset -4px -4px 8px ${SHADOW_LIGHT}, inset 4px 4px 8px ${SHADOW_DARK}`,
    }}>
      <p style={{ fontSize: 13, color: OFF_WHITE, marginBottom: 4, fontWeight: 600 }}>
        📱 Demandez à votre livreur de scanner ce QR
      </p>
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 14, lineHeight: 1.5 }}>
        Expérience pro pour vos clients · Tracking VIP activé · Zéro retour
      </p>
      <div style={{ display: "flex", justifyContent: "center", padding: 12, background: "#F5F0E8", borderRadius: 8 }}>
        <img src={qrImageUrl} alt="QR code livreur" width={200} height={200} />
      </div>
    </div>
  );
}
