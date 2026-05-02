"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BG = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK = "#0c0d11";
const OFF_WHITE = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.4)";
const EMERALD = "#10B981";

interface Props {
  orderId: string;
  driverName: string | null;
  driverPhone: string | null;
}

export function IndependentDeliveryButton({ orderId, driverName, driverPhone }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [name, setName] = useState(driverName || "");
  const [phone, setPhone] = useState(driverPhone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAssigned = !!driverName && !!driverPhone;

  const qrUrl = `https://golivra.app/livreur/rejoindre?order=${orderId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=1a1b1f&color=F5F0E8&margin=10`;

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("orders")
        .update({
          independent_driver_name: name,
          independent_driver_phone: phone,
          status: "shipped",
        })
        .eq("id", orderId);

      if (dbError) throw dbError;

      // TODO: trigger WhatsApp notif acheteur
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setLoading(false);
    }
  }

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
    <div>
      <div style={{
        background: BG,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
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

      <form onSubmit={handleAssign}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>Ou entrez les infos manuellement :</p>
        <input
          type="text"
          placeholder="Prénom du livreur"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            width: "100%",
            background: BG,
            border: "none",
            borderRadius: 10,
            padding: "12px 14px",
            color: OFF_WHITE,
            fontSize: 14,
            marginBottom: 10,
            boxShadow: `inset -3px -3px 6px ${SHADOW_LIGHT}, inset 3px 3px 6px ${SHADOW_DARK}`,
            outline: "none",
          }}
        />
        <input
          type="tel"
          placeholder="WhatsApp du livreur (ex: 0555123456)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{
            width: "100%",
            background: BG,
            border: "none",
            borderRadius: 10,
            padding: "12px 14px",
            color: OFF_WHITE,
            fontSize: 14,
            marginBottom: 14,
            boxShadow: `inset -3px -3px 6px ${SHADOW_LIGHT}, inset 3px 3px 6px ${SHADOW_DARK}`,
            outline: "none",
          }}
        />

        {error && (
          <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 10 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: EMERALD,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Assignation..." : "Confirmer livraison indépendante"}
        </button>
      </form>
    </div>
  );
}