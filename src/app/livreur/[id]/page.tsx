"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BG = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK = "#0c0d11";
const OFF_WHITE = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.4)";
const EMERALD = "#10B981";

const card: React.CSSProperties = {
  background: BG,
  borderRadius: 18,
  padding: 20,
  boxShadow: `-8px -8px 16px ${SHADOW_LIGHT}, 8px 8px 16px ${SHADOW_DARK}`,
  flex: 1,
  minWidth: 0,
};

export default function DriverDashboard() {
  const { id } = useParams();
  const [driver, setDriver] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    success: 0,
    cash: 0,
  });
  const [shops, setShops] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: driverData } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", id)
        .single();

      if (!driverData) return;
      setDriver(driverData);

      const { data: orders } = await supabase
        .from("orders")
        .select("*, profile:profiles(store_name)")
        .eq("independent_driver_phone", driverData.whatsapp);

      if (!orders) return;

      const total = orders.length;
      const pending = orders.filter(o => o.status === "shipped").length;
      const success = orders.filter(o => o.status === "delivered").length;
      const cash = orders
        .filter(o => o.status !== "delivered")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setStats({ total, pending, success, cash });

      const shopMap: Record<string, number> = {};
      orders.forEach(o => {
        const name = o.profile?.store_name || "Boutique";
        shopMap[name] = (shopMap[name] || 0) + (o.total_amount || 0);
      });
      setShops(Object.entries(shopMap).map(([name, amount]) => ({ name, amount })));
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, padding: 20 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, paddingTop: 12 }}>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Bonjour 👋</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: OFF_WHITE }}>{driver?.prenom}</h1>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{driver?.wilaya} · {driver?.couleur_casque}</p>
        </div>

        {/* 4 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Total livraisons</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: OFF_WHITE }}>{stats.total}</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>En attente</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>{stats.pending}</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Réussies</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: EMERALD }}>{stats.success}</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Cash à remettre</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: OFF_WHITE }}>{stats.cash.toLocaleString()} DA</p>
          </div>
        </div>

        {/* Shops */}
        {shops.length > 0 && (
          <div style={{ ...card, marginBottom: 0 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>Boutiques</h2>
            {shops.map((s, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 12,
                marginBottom: 12,
                borderBottom: i < shops.length - 1 ? "1px solid rgba(245,240,232,0.06)" : "none",
              }}>
                <p style={{ fontSize: 14, color: OFF_WHITE }}>{s.name}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: EMERALD }}>{s.amount.toLocaleString()} DA</p>
              </div>
            ))}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 12,
              borderTop: "1px solid rgba(245,240,232,0.1)",
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE }}>Total</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: EMERALD }}>
                {shops.reduce((s, i) => s + i.amount, 0).toLocaleString()} DA
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
