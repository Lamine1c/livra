"use client";

import { OrderStatus } from "@/types";

const EMERALD = "#10B981";
const MUTED = "rgba(245,240,232,0.4)";
const OFF_WHITE = "#F5F0E8";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending",    label: "Commande reçue" },
  { status: "confirmed",  label: "Confirmée" },
  { status: "processing", label: "En traitement" },
  { status: "shipped",    label: "Prise en charge Yalidine" },
  { status: "delivered",  label: "Livrée" },
];

const STATUS_RANK: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2,
  shipped: 3, delivered: 4,
  cancelled: -1, returned: -1,
};

interface TrackingTimelineProps {
  status: OrderStatus;
  trackingNumber?: string | null;
}

export function TrackingTimeline({ status, trackingNumber }: TrackingTimelineProps) {
  const currentRank = STATUS_RANK[status] ?? 0;
  const isFailed = status === "cancelled" || status === "returned";

  if (isFailed) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{status === "cancelled" ? "❌" : "↩️"}</span>
        <span style={{ color: "#F87171", fontSize: 14, fontWeight: 600 }}>
          {status === "cancelled" ? "Commande annulée" : "Colis retourné"}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {STEPS.map((step, index) => {
        const stepRank = STATUS_RANK[step.status] ?? 0;
        const isDone = stepRank < currentRank;
        const isActive = stepRank === currentRank;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.status} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {/* Colonne gauche : cercle + ligne */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isDone ? 10 : 14,
                background: isDone || isActive ? "rgba(16,185,129,0.15)" : "rgba(245,240,232,0.05)",
                border: isActive
                  ? `2px solid ${EMERALD}`
                  : isDone
                  ? "2px solid rgba(16,185,129,0.4)"
                  : "2px solid rgba(245,240,232,0.08)",
                boxShadow: isActive ? "0 0 12px rgba(16,185,129,0.25)" : "none",
                color: isDone ? EMERALD : "transparent",
              }}>
                {isDone ? "●" : ""}
              </div>
              {!isLast && (
                <div style={{
                  width: 2,
                  flex: 1,
                  minHeight: 20,
                  background: isDone ? "rgba(16,185,129,0.4)" : "rgba(245,240,232,0.06)",
                  margin: "3px 0",
                }} />
              )}
            </div>

            {/* Texte */}
            <div style={{ paddingTop: 4, paddingBottom: isLast ? 0 : 18 }}>
              <p style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isDone || isActive ? OFF_WHITE : MUTED,
                margin: 0,
              }}>
                {step.label}
              </p>
              {isActive && trackingNumber && step.status === "shipped" && (
                <p style={{ fontSize: 11, color: EMERALD, marginTop: 2, fontFamily: "monospace" }}>
                  {trackingNumber}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
