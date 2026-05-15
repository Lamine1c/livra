"use client";

import dynamic from "next/dynamic";
import YalidineTracker from "@/components/track/yalidine-tracker";

// Load Mapbox-dependent component only on the client to avoid SSR issues
const MotoPersoTracker = dynamic(
  () => import("@/components/track/moto-perso-tracker"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          backgroundColor: "#1a1b1f",
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "rgba(245, 240, 232, 0.5)", fontSize: 14 }}>Chargement…</p>
      </div>
    ),
  }
);

type OrderData = {
  id: string;
  reference: string;
  status: string;
  deliveryMode: "moto_perso" | "yalidine";
  driverName: string | null;
  driverPhone: string | null;
  createdAt: string;
};

type DeliveryData = {
  id: string;
  lastLat: number | null;
  lastLng: number | null;
  deliveryStatus: string;
} | null;

type TrackClientProps = {
  order: OrderData;
  vendorName: string;
  delivery: DeliveryData;
  token: string;
};

export default function TrackClient({ order, vendorName, delivery, token }: TrackClientProps) {
  if (order.deliveryMode === "moto_perso") {
    return (
      <MotoPersoTracker
        orderStatus={order.status}
        driverName={order.driverName}
        driverPhone={order.driverPhone}
        vendorName={vendorName}
        initialDelivery={delivery}
        token={token}
      />
    );
  }

  if (order.deliveryMode === "yalidine") {
    return (
      <YalidineTracker
        orderStatus={order.status}
        vendorName={vendorName}
      />
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#1a1b1f",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <p style={{ color: "rgba(245, 240, 232, 0.6)", fontSize: 14, textAlign: "center" }}>
        Mode de livraison non reconnu.
      </p>
    </div>
  );
}
