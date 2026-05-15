"use client";

import { useEffect, useRef, useState } from "react";
import InfoPanel from "./info-panel";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";

type InitialDelivery = {
  id: string;
  lastLat: number | null;
  lastLng: number | null;
  deliveryStatus: string;
} | null;

type MotoPersoTrackerProps = {
  orderStatus: string;
  driverName: string | null;
  driverPhone: string | null;
  vendorName: string;
  initialDelivery: InitialDelivery;
  token: string;
};

// Default center: Algiers
const DEFAULT_CENTER: [number, number] = [3.042048, 36.737221];

function resolveStatusLabel(orderStatus: string, deliveryStatus: string | null): string {
  if (orderStatus === "delivered" || deliveryStatus === "completed") return "Livré";
  if (deliveryStatus === "active") return "En route vers vous";
  return "En attente";
}

export default function MotoPersoTracker({
  orderStatus,
  driverName,
  driverPhone,
  vendorName,
  initialDelivery,
  token,
}: MotoPersoTrackerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(
    initialDelivery?.deliveryStatus ?? null
  );
  const [hasPosition, setHasPosition] = useState(
    initialDelivery?.lastLat != null && initialDelivery?.lastLng != null
  );
  const [liveOrderStatus, setLiveOrderStatus] = useState<string>(orderStatus);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);

  const isDelivered = liveOrderStatus === "delivered" || deliveryStatus === "completed";
  const statusLabel = resolveStatusLabel(liveOrderStatus, deliveryStatus);

  // Initialise Mapbox once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initLat = initialDelivery?.lastLat ?? DEFAULT_CENTER[1];
    const initLng = initialDelivery?.lastLng ?? DEFAULT_CENTER[0];
    const hasInitPos = initialDelivery?.lastLat != null;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [initLng, initLat],
      zoom: hasInitPos ? 15 : 10,
      attributionControl: false,
    });
    mapRef.current = map;

    // Driver marker (emerald dot)
    if (hasInitPos) {
      const el = createMarkerElement();
      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat([initLng, initLat])
        .addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 5s — Realtime is blocked by RLS for anon buyer client
  useEffect(() => {
    if (isDelivered) return;

    const startedAt = Date.now();
    const MAX_DURATION_MS = 60 * 60 * 1000; // 1h absolute timeout

    const interval = setInterval(async () => {
      if (Date.now() - startedAt > MAX_DURATION_MS) {
        console.log("[MotoTracker] polling timeout reached");
        clearInterval(interval);
        return;
      }

      try {
        const res = await fetch(`/api/track/status?t=${token}`);
        if (!res.ok) {
          console.error("[MotoTracker] poll failed", res.status);
          return;
        }
        const data = await res.json() as {
          orderStatus: string;
          deliveredAt: string | null;
          delivery: { lastLat: number | null; lastLng: number | null; deliveryStatus: string } | null;
        };

        if (data.orderStatus) setLiveOrderStatus(data.orderStatus);
        if (data.deliveredAt) setDeliveredAt(data.deliveredAt);
        if (data.delivery?.deliveryStatus) setDeliveryStatus(data.delivery.deliveryStatus);

        if (data.delivery?.lastLat != null && data.delivery?.lastLng != null) {
          const pos: [number, number] = [data.delivery.lastLng, data.delivery.lastLat];
          setHasPosition(true);
          const map = mapRef.current;
          if (map) {
            if (markerRef.current) {
              markerRef.current.setLngLat(pos);
            } else {
              const el = createMarkerElement();
              markerRef.current = new mapboxgl.Marker(el).setLngLat(pos).addTo(map);
            }
            map.flyTo({ center: pos, duration: 1500 });
          }
        }

        if (data.orderStatus === "delivered" || data.orderStatus === "cancelled") {
          clearInterval(interval);
        }
      } catch (e) {
        console.error("[MotoTracker] poll error", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, isDelivered]);

  return (
    <div
      style={{
        backgroundColor: "#1a1b1f",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Map — 75% */}
      <div
        ref={mapContainerRef}
        style={{ flex: "0 0 75%", position: "relative", overflow: "hidden" }}
      >
        {/* Delivered overlay */}
        {isDelivered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#076a4d",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 56 }}>✅</span>
            <p
              style={{
                color: "#F5F0E8",
                fontSize: 22,
                fontWeight: 700,
                marginTop: 16,
                textAlign: "center",
                padding: "0 32px",
              }}
            >
              Commande livrée
            </p>
            {deliveredAt && (
              <p style={{ color: "rgba(245, 240, 232, 0.7)", fontSize: 14, marginTop: 6 }}>
                {new Date(deliveredAt).toLocaleTimeString("fr-DZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            <p style={{ color: "rgba(245, 240, 232, 0.7)", fontSize: 15, marginTop: 8 }}>
              Merci !
            </p>
          </div>
        )}

        {/* No position banner */}
        {!hasPosition && !isDelivered && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(21, 22, 26, 0.92)",
              borderRadius: 20,
              padding: "8px 18px",
              zIndex: 5,
              whiteSpace: "nowrap",
            }}
          >
            <p style={{ color: "rgba(245, 240, 232, 0.65)", fontSize: 13, margin: 0 }}>
              Localisation du livreur non disponible
            </p>
          </div>
        )}
      </div>

      {/* Info panel — 25% */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <InfoPanel
          statusLabel={statusLabel}
          isDelivered={isDelivered}
          driverName={driverName}
          driverPhone={driverPhone}
          vendorName={vendorName}
          mode="moto_perso"
        />
      </div>
    </div>
  );
}

function createMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #076a4d;
    border: 3px solid #F5F0E8;
    box-shadow: 0 2px 8px rgba(7, 106, 77, 0.5);
    cursor: default;
  `;
  return el;
}
