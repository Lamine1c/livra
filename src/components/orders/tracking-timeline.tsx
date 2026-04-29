"use client";

import { OrderStatus } from "@/types";

const BG = "#1a1b1f";
const SL = "#1e1f24";
const SD = "#0c0d11";
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
          <div key={step.status} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: BG,
                boxShadow: isActive
                  ? `-5px -5px 10px ${SL}, 5px 5px 10px ${SD}, 0 0 14px rgba(16,185,129,0.2)`
                  : `-5px -5px 10px ${SL}, 5px 5px 10px ${SD}`,
              }}>
                {isDone && (
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(245,240,232,0.25)" }} />
                )}
                {isActive && (
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: EMERALD, boxShadow: `0 0 6px ${EMERALD}` }} />
                )}
              </div>
              {!isLast && (
                <div style={{
                  width: 2,
                  flex: 1,
                  minHeight: 20,
                  background: isDone ? "rgba(16,185,129,0.2)" : "rgba(245,240,232,0.05)",
                  margin: "4px 0",
                  borderRadius: 2,
                }} />
              )}
            </div>

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
