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
  const params = useParams();
  const id = params?.id as string;
  const [driver, setDriver] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, success: 0, cash: 0 });
  const [shops, setShops] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const supabase = createClient();

        const { data: driverData, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !driverData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setDriver(driverData);

        const { data: orders } = await supabase
          .from("orders")
          .select("status, total_amount, user_id")
          .eq("independent_driver_phone", driverData.whatsapp);

        if (orders && orders.length > 0) {
          const total = orders.length;
          const pending = orders.filter(o => o.status === "shipped").length;
          const success = orders.filter(o => o.status === "delivered").length;
          const cash = orders
            .filter(o => o.status !== "delivered")
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);
          setStats({ total, pending, success, cash });

          const userIds = [...new Set(orders.map(o => o.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, store_name")
            .in("id", userIds);

          const shopMap: Record<string, number> = {};
          orders.forEach(o => {
            const profile = profiles?.find(p => p.id === o.user_id);
            const name = profile?.store_name || "Boutique";
            shopMap[name] = (shopMap[name] || 0) + (o.total_amount || 0);
          });
          setShops(Object.entries(shopMap).map(([name, amount]) => ({ name, amount })));
        }
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
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

  if (notFound) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: MUTED, fontSize: 14, textAlign: "center" }}>Livreur introuvable. Scannez à nouveau le QR code.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, padding: 20 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: BG,
              boxShadow: `-4px -4px 8px ${SHADOW_LIGHT}, 4px 4px 8px ${SHADOW_DARK}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>🛵</div>
            <div>
              <p style={{ fontSize: 12, color: MUTED }}>Bonjour 👋</p>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: OFF_WHITE }}>{driver?.prenom}</h1>
            </div>
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{driver?.wilaya} · {driver?.couleur_casque}</p>
        </div>

        {/* 4 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Total</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: OFF_WHITE }}>{stats.total}</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>En attente</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: "#F59E0B" }}>{stats.pending}</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Réussies</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: EMERALD }}>{stats.success}</p>
          </div>
          <div style={card}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Cash</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: OFF_WHITE }}>{stats.cash.toLocaleString()} DA</p>
          </div>
        </div>

        {/* Shops */}
        {shops.length > 0 && (
          <div style={{ ...card, flex: "none" }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>Boutiques</h2>
            {shops.map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingBottom: 12, marginBottom: 12,
                borderBottom: i < shops.length - 1 ? "1px solid rgba(245,240,232,0.06)" : "none",
              }}>
                <p style={{ fontSize: 14, color: OFF_WHITE }}>{s.name}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: EMERALD }}>{s.amount.toLocaleString()} DA</p>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(245,240,232,0.1)" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE }}>Total</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: EMERALD }}>
                {shops.reduce((s, i) => s + i.amount, 0).toLocaleString()} DA
              </p>
            </div>
          </div>
        )}

        {shops.length === 0 && (
          <div style={{ ...card, flex: "none", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: MUTED }}>Aucune livraison pour l'instant.</p>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Les commandes apparaîtront ici dès qu'un vendeur vous assigne une livraison.</p>
          </div>
        )}

      </div>
    </div>
  );
}
