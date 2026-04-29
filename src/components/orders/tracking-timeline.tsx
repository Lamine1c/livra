"use client";

import { OrderStatus } from "@/types";

const BG = "#1a1b1f";
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

        // A2-S1 styles
        const circleDone = {
          boxShadow: "inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03)",
          background: BG,
          border: "none",
        };
        const circleActive = {
          boxShadow: "-4px -4px 8px #1e1f24, 4px 4px 8px #0c0d11, 0 0 16px rgba(16,185,129,0.3)",
          background: "rgba(16,185,129,0.12)",
          border: `1.5px solid rgba(16,185,129,0.5)`,
        };
        const circlePending = {
          boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.3), inset -1px -1px 3px rgba(255,255,255,0.02)",
          background: BG,
          border: "none",
        };

        const circleStyle = isDone ? circleDone : isActive ? circleActive : circlePending;

        return (
          <div key={step.status} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {/* Cercle + ligne */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...circleStyle,
              }}>
                {isDone && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "rgba(16,185,129,0.5)",
                  }} />
                )}
                {isActive && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: EMERALD,
                    boxShadow: `0 0 8px ${EMERALD}`,
                  }} />
                )}
              </div>
              {!isLast && (
                <div style={{
                  width: 2,
                  flex: 1,
                  minHeight: 20,
                  background: isDone ? "rgba(16,185,129,0.3)" : "rgba(245,240,232,0.05)",
                  margin: "4px 0",
                  borderRadius: 2,
                }} />
              )}
            </div>

            {/* Texte */}
            <div style={{ paddingTop: 5, paddingBottom: isLast ? 0 : 20 }}>
              <p style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? OFF_WHITE : isDone ? MUTED : "rgba(245,240,232,0.2)",
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
