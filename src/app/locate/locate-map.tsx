"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const ALGIERS: [number, number] = [3.0588, 36.7538];

type Props = {
  token: string;
  orderNumber: string;
  vendorName: string;
  alreadyConfirmed: boolean;
  buyerLat: number | null;
  buyerLng: number | null;
};

export default function LocateClient({
  token,
  orderNumber,
  vendorName,
  alreadyConfirmed: initialConfirmed,
  buyerLat,
  buyerLng,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const initCenter: [number, number] =
      initialConfirmed && buyerLat != null && buyerLng != null
        ? [buyerLng, buyerLat]
        : ALGIERS;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initCenter,
      zoom: initialConfirmed && buyerLat != null ? 15 : 11,
      attributionControl: false,
    });
    mapRef.current = map;

    const marker = new mapboxgl.Marker({
      element: createPinElement(),
      draggable: !initialConfirmed,
      anchor: "bottom",
    })
      .setLngLat(initCenter)
      .addTo(map);
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    markerRef.current?.setDraggable(!confirmed);
  }, [confirmed]);

  function handleUseCurrentPosition() {
    if (!("geolocation" in navigator)) {
      setGeoError("Géolocalisation non supportée par ce navigateur.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        mapRef.current?.flyTo({ center, zoom: 16 });
        markerRef.current?.setLngLat(center);
        setGeoError(null);
        setGeoLoading(false);
      },
      () => {
        setGeoError("Géolocalisation refusée. Place le pin manuellement sur la carte.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleConfirm() {
    const lngLat = markerRef.current?.getLngLat();
    if (!lngLat) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/locate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lat: lngLat.lat, lng: lngLat.lng }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setConfirmed(true);
      } else {
        alert(json.error ?? "Erreur lors de l'enregistrement");
      }
    } catch {
      alert("Erreur réseau. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#1a1b1f", height: "100dvh", position: "relative", overflow: "hidden" }}>
      {/* Map full screen */}
      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Header overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: 40,
          background: "linear-gradient(to bottom, rgba(26,27,31,0.95) 0%, transparent 100%)",
        }}
      >
        <div
          style={{
            backgroundColor: "#1e2028",
            border: "1px solid #252525",
            borderRadius: 20,
            padding: "14px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#F5F0E8", fontSize: 17, fontWeight: 700, margin: 0 }}>
            📍 Confirme ta position
          </p>
          <p style={{ color: "rgba(245,240,232,0.6)", fontSize: 13, margin: "4px 0 0" }}>
            Notre motard te trouve sans appeler ✅
          </p>
          <p style={{ color: "rgba(245,240,232,0.35)", fontSize: 11, margin: "4px 0 0" }}>
            {vendorName} · {orderNumber}
          </p>
        </div>
      </div>

      {/* Geo loading */}
      {geoLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(21,22,26,0.92)",
            borderRadius: 20,
            padding: "10px 20px",
            zIndex: 20,
          }}
        >
          <p style={{ color: "rgba(245,240,232,0.7)", fontSize: 14, margin: 0 }}>
            Localisation en cours...
          </p>
        </div>
      )}

      {/* Geo error — shown only after user clicks the button and geo fails */}
      {geoError && !geoLoading && !confirmed && (
        <div
          style={{
            position: "absolute",
            bottom: 210,
            left: 16,
            right: 16,
            backgroundColor: "rgba(21,22,26,0.96)",
            border: "1px solid rgba(245,240,232,0.12)",
            borderRadius: 16,
            padding: "12px 16px",
            zIndex: 15,
          }}
        >
          <p style={{ color: "rgba(245,240,232,0.65)", fontSize: 13, margin: 0 }}>
            {geoError}
          </p>
        </div>
      )}

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 40,
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          background: "linear-gradient(to top, rgba(26,27,31,1) 60%, transparent 100%)",
        }}
      >
        {!confirmed ? (
          <>
            <button
              onClick={handleUseCurrentPosition}
              style={{
                width: "100%",
                backgroundColor: "#076a4d",
                color: "#F5F0E8",
                border: "none",
                borderRadius: 24,
                padding: "18px 24px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 12,
                display: "block",
                letterSpacing: 0.3,
              }}
            >
              Utiliser ma position actuelle
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              style={{
                width: "100%",
                backgroundColor: "rgba(30,32,40,0.95)",
                color: "#F5F0E8",
                border: "1px solid rgba(245,240,232,0.15)",
                borderRadius: 24,
                padding: "16px 24px",
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                display: "block",
              }}
            >
              {submitting ? "Enregistrement..." : "Confirmer cette position"}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                backgroundColor: "rgba(7,106,77,0.15)",
                border: "1px solid rgba(7,106,77,0.3)",
                borderRadius: 20,
                padding: "16px 20px",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              <p style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: 0 }}>
                ✅ Position enregistrée ! Tu peux fermer cette page.
              </p>
            </div>
            <button
              onClick={() => setConfirmed(false)}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                color: "rgba(245,240,232,0.4)",
                border: "none",
                padding: "12px 24px",
                fontSize: 14,
                cursor: "pointer",
                display: "block",
              }}
            >
              Modifier ma position
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function createPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "width: 32px; height: 42px; cursor: grab;";
  el.innerHTML =
    '<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M16 0C7.163 0 0 7.163 0 16c0 11.556 16 26 16 26s16-14.444 16-26C32 7.163 24.837 0 16 0z" fill="#076a4d"/>' +
    '<circle cx="16" cy="16" r="7" fill="#F5F0E8"/>' +
    "</svg>";
  return el;
}
