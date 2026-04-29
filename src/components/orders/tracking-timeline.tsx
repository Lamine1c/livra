"use client";

import { OrderStatus } from "@/types";

const BG = "#1a1b1f";
const EMERALD = "#10B981";
const MUTED = "rgba(245,240,232,0.4)";
const OFF_WHITE = "#F5F0E8";

const STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
  { status: "pending",    label: "Commande reçue",          emoji: "📋" },
  { status: "confirmed",  label: "Confirmée",               emoji: "✅" },
  { status: "processing", label: "En préparation",          emoji: "📦" },
  { status: "shipped",    label: "Prise en charge Yalidine",emoji: "🚚" },
  { status: "delivered",  label: "Livrée",                  emoji: "🎉" },
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
      <div style={{ background: BG, borderRadius: 14, padding: "14px 16px", boxShadow: "inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{status === "cancelled" ? "❌" : "↩️"}</span>
        <span style={{ color: "#F87171", fontSize: 14, fontWeight: 600 }}>
          {status === "cancelled" ? "Commande annulée" : "Colis retourné"}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {STEPS.map((step, index) => {
        const stepRank = STATUS_RANK[step.status] ?? 0;
        const isDone = stepRank < currentRank;
        const isActive = stepRank === currentRank;
        const isPending = stepRank > currentRank;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.status} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: isDone || isActive ? "rgba(16,185,129,0.15)" : "rgba(245,240,232,0.05)", border: isActive ? `2px solid ${EMERALD}` : isDone ? "2px solid rgba(16,185,129,0.4)" : "2px solid rgba(245,240,232,0.1)", boxShadow: isActive ? "0 0 12px rgba(16,185,129,0.3)" : "none" }}>
                {isDone ? "✓" : isPending ? "" : step.emoji}
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 24, background: isDone ? EMERALD : "rgba(245,240,232,0.08)", margin: "4px 0" }} />
              )}
            </div>
            <div style={{ paddingTop: 6, paddingBottom: isLast ? 0 : 20 }}>
              <p style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isDone || isActive ? OFF_WHITE : MUTED, margin: 0 }}>
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
