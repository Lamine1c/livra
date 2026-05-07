"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import InfoPanel from "./info-panel";

type YalidineTrackerProps = {
  orderStatus: string;
  vendorName: string;
};

type StepState = "done" | "active" | "future";

const STEPS = ["Confirmée", "Prise en charge", "En route", "Livrée"];

// Minimal status → numeric rank (same order as STATUS_RANK in yalidine.ts)
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

function getStepState(stepIndex: number, status: string): StepState {
  // Terminal failure states: only step 0 is done
  if (status === "cancelled" || status === "returned") {
    return stepIndex === 0 ? "done" : "future";
  }

  const rank = STATUS_RANK[status] ?? 0;

  // Thresholds (min rank for "done"):
  //   Step 0 "Confirmée"       → done when rank >= 0 (always)
  //   Step 1 "Prise en charge" → done when rank >= 3 (shipped)
  //   Step 2 "En route"        → done when rank >= 4 (delivered)
  //   Step 3 "Livrée"          → done when rank >= 4 (delivered)
  const doneAt = [0, 3, 4, 4];

  // Active threshold (min rank to show "active" when not yet done):
  //   Step 1 → active when rank >= 1 (confirmed/processing)
  //   Step 2 → active when rank >= 3 (shipped)
  const activeAt = [0, 1, 3, 4];

  if (rank >= doneAt[stepIndex]) return "done";
  if (rank >= activeAt[stepIndex]) return "active";
  return "future";
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    processing: "En préparation",
    shipped: "En route",
    delivered: "Livrée",
    cancelled: "Annulée",
    returned: "Retournée",
  };
  return map[status] ?? status;
}

export default function YalidineTracker({ orderStatus, vendorName }: YalidineTrackerProps) {
  const router = useRouter();
  const isTerminal =
    orderStatus === "delivered" || orderStatus === "cancelled" || orderStatus === "returned";

  // Refresh data every 5 minutes while not in a terminal state
  useEffect(() => {
    if (isTerminal) return;
    const id = setInterval(() => router.refresh(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [router, isTerminal]);

  return (
    <div
      style={{
        backgroundColor: "#1a1b1f",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Timeline content */}
      <div
        style={{
          flex: 1,
          padding: "56px 28px 32px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <h2
          style={{
            color: "#F5F0E8",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          📦 Suivi de votre commande
        </h2>

        {/* Terminal failure state */}
        {(orderStatus === "cancelled" || orderStatus === "returned") ? (
          <div
            style={{
              backgroundColor: "#15161a",
              borderRadius: 20,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ color: "rgba(245, 240, 232, 0.7)", fontSize: 16 }}>
              {orderStatus === "cancelled" ? "❌" : "↩️"}{" "}
              Commande {getStatusLabel(orderStatus).toLowerCase()}
            </p>
          </div>
        ) : (
          /* Timeline steps */
          <div style={{ display: "flex", flexDirection: "column" }}>
            {STEPS.map((label, i) => {
              const state: StepState = getStepState(i, orderStatus);
              const isLast = i === STEPS.length - 1;

              return (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {/* Dot + connector */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                      width: 20,
                    }}
                  >
                    <div
                      style={{
                        width: state === "active" ? 18 : 12,
                        height: state === "active" ? 18 : 12,
                        borderRadius: "50%",
                        backgroundColor: state === "future" ? "#252525" : "#076a4d",
                        border: state === "active" ? "3px solid rgba(7, 106, 77, 0.35)" : "none",
                        flexShrink: 0,
                        animation: state === "active" ? "livra-pulse 1.8s ease-in-out infinite" : "none",
                        transition: "all 0.3s",
                      }}
                    />
                    {!isLast && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 40,
                          backgroundColor: state === "done" ? "#076a4d" : "#252525",
                          transition: "background-color 0.4s",
                        }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div style={{ paddingBottom: isLast ? 0 : 40, paddingTop: 0 }}>
                    <p
                      style={{
                        color:
                          state === "future"
                            ? "rgba(245, 240, 232, 0.3)"
                            : "#F5F0E8",
                        fontSize: 15,
                        fontWeight: state === "active" ? 700 : 500,
                        lineHeight: 1.2,
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {label}
                      {state === "active" && (
                        <span
                          style={{
                            color: "#076a4d",
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          En cours
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info panel */}
      <InfoPanel
        statusLabel={getStatusLabel(orderStatus)}
        isDelivered={orderStatus === "delivered"}
        driverName={null}
        driverPhone={null}
        vendorName={vendorName}
        mode="yalidine"
      />

      <style>{`
        @keyframes livra-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
