import Link from "next/link";
import { ShoppingCart, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";

function avatarColor(name: string): string {
  const palette = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-orange-500", "bg-rose-500", "bg-amber-500",
  ];
  return palette[name.toUpperCase().charCodeAt(0) % palette.length];
}

const STATUS_DOT: Record<OrderStatus, { color: string; label: string }> = {
  pending:    { color: "#F59E0B", label: "En attente" },
  confirmed:  { color: "#60A5FA", label: "Confirmée" },
  processing: { color: "#60A5FA", label: "En cours" },
  shipped:    { color: "#60A5FA", label: "En cours" },
  delivered:  { color: "#10B981", label: "Livrée" },
  cancelled:  { color: "#F87171", label: "Annulée" },
  returned:   { color: "#8A8896", label: "Retournée" },
};

const STATS_CONFIG = [
  { key: "orders",  label: "Commandes",  icon: ShoppingCart, desktopCls: "text-emerald-600" },
  { key: "pending", label: "En attente", icon: Clock,        desktopCls: "text-yellow-600" },
  { key: "clients", label: "Clients",    icon: Users,        desktopCls: "text-blue-600" },
  { key: "revenue", label: "CA total",   icon: TrendingUp,   desktopCls: "text-emerald-600" },
];

const card3D = {
  background: "#1A1C24",
  border: "0.5px solid #2D2F3A",
  boxShadow:
    "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 -1px 0 0 rgba(0,0,0,0.4) inset, 0 4px 12px rgba(0,0,0,0.4)",
};

const card3DGlow = {
  background: "#1A1C24",
  border: "0.5px solid #2D2F3A",
  boxShadow:
    "0 0 20px rgba(16,185,129,0.12), 0 1px 0 0 rgba(255,255,255,0.05) inset, 0 -1px 0 0 rgba(0,0,0,0.4) inset, 0 4px 12px rgba(0,0,0,0.4)",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterdayStr = yd.toISOString().split("T")[0];

  const [ordersResult, clientsCountResult, profileResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*, client:clients(*)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .single(),
  ]);

  const orders = (ordersResult.data as Order[]) ?? [];
  const totalClients = clientsCountResult.count ?? 0;
  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);

  const todayOrders     = orders.filter((o) => o.created_at.startsWith(today));
  const yesterdayOrders = orders.filter((o) => o.created_at.startsWith(yesterdayStr));
  const pendingOrders   = orders.filter((o) => o.status === "pending");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const todayCount       = todayOrders.length;
  const todayRevenue     = todayOrders.reduce((s, o) => s + o.total_amount, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total_amount, 0);
  const todayDelivered   = todayOrders.filter((o) => o.status === "delivered").length;

  const recentOrders = orders.slice(0, 5);

  const firstName =
    profileResult.data?.full_name?.split(" ")[0] ??
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    "";

  const statsValues: Record<string, string | number> = {
    orders:  orders.length,
    pending: pendingOrders.length,
    clients: totalClients,
    revenue: formatCurrency(totalRevenue),
  };

  const revenueDeltaColor =
    yesterdayRevenue === 0
      ? todayRevenue > 0 ? "#10B981" : "#5A5B65"
      : todayRevenue >= yesterdayRevenue ? "#10B981" : "#5A5B65";

  const mobileStats = [
    {
      key: "orders",
      label: "Commandes",
      Icon: ShoppingCart,
      value: orders.length,
      delta: todayCount > 0 ? `+${todayCount} aujourd'hui` : "Aucune aujourd'hui",
      deltaColor: todayCount > 0 ? "#10B981" : "#5A5B65",
      iconBg: "#1A1B25",
      iconColor: "#60A5FA",
      glow: false,
    },
    {
      key: "pending",
      label: "En attente",
      Icon: Clock,
      value: pendingOrders.length,
      delta: "À traiter",
      deltaColor: "#F59E0B",
      iconBg: "#1A1B25",
      iconColor: "#FB923C",
      glow: false,
    },
    {
      key: "delivered",
      label: "Livrées",
      Icon: CheckCircle,
      value: deliveredOrders.length,
      delta: todayDelivered > 0 ? `+${todayDelivered} aujourd'hui` : "Aucune aujourd'hui",
      deltaColor: todayDelivered > 0 ? "#10B981" : "#5A5B65",
      iconBg: "#1A1B25",
      iconColor: "#34D399",
      glow: false,
    },
    {
      key: "revenue",
      label: "CA du jour",
      Icon: TrendingUp,
      value: formatCurrency(todayRevenue),
      delta:
        yesterdayRevenue === 0
          ? todayRevenue > 0 ? "Premier jour !" : "Aucune vente"
          : todayRevenue >= yesterdayRevenue
            ? `+${formatCurrency(todayRevenue - yesterdayRevenue)} vs hier`
            : `-${formatCurrency(yesterdayRevenue - todayRevenue)} vs hier`,
      deltaColor: revenueDeltaColor,
      iconBg: "#0A2A1A",
      iconColor: "#10B981",
      glow: true,
    },
  ];

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[#0A0B10] md:bg-transparent">

      {/* ── Desktop header ───────────────────────────────────── */}
      <div className="hidden md:block">
        <Header
          title="Tableau de bord"
          subtitle={`Bonjour ${user?.user_metadata?.full_name ?? ""}`}
        />
      </div>

      {/* ── Mobile header ────────────────────────────────────── */}
      <div
        className="md:hidden flex items-center justify-between px-5 pb-6"
        style={{ paddingTop: "max(env(safe-area-inset-top), 20px)" }}
      >
        <div>
          <p style={{ fontSize: 12, color: "#8A8896", lineHeight: 1 }}>Bonjour 👋</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.15, marginTop: 4 }}>
            {firstName || "Bienvenue"}
          </h1>
          <p style={{ fontSize: 12, color: "#6A6B75", marginTop: 4, lineHeight: 1 }}>
            Voici votre journée
          </p>
        </div>
        <div
          className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
          style={{
            width: 36, height: 36, fontSize: 14,
            background: "#10B981",
            boxShadow: "0 0 12px rgba(16,185,129,0.2)",
          }}
        >
          {(firstName || user?.email || "?")[0].toUpperCase()}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-2 px-4 pb-40 md:p-6 space-y-6 md:space-y-6">

        {/* ── Mobile stats 2×2 ───────────────────────────────── */}
        <div className="md:hidden grid grid-cols-2 gap-[14px]">
          {mobileStats.map(({ key, label, Icon, value, delta, deltaColor, iconBg, iconColor, glow }) => (
            <div
              key={key}
              className="rounded-2xl flex flex-col gap-2"
              style={{ ...( glow ? card3DGlow : card3D), padding: 18 }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, background: iconBg, borderRadius: 10 }}
              >
                <Icon style={{ width: 16, height: 16, color: iconColor }} />
              </div>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6A6B75" }}>
                {label}
              </p>
              <p style={{ fontSize: 30, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>
                {value}
              </p>
              <p style={{ fontSize: 11, color: deltaColor, lineHeight: 1 }}>
                {delta}
              </p>
            </div>
          ))}
        </div>

        {/* ── Desktop stats 4-col ─────────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-4 md:gap-4">
          {STATS_CONFIG.map(({ key, label, icon: Icon, desktopCls }) => (
            <div key={key} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{statsValues[key]}</p>
                </div>
                <div className={`rounded-xl bg-gray-50 p-3 ${desktopCls}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Mobile — Dernières commandes ─────────────────────── */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>
              Dernières commandes
            </h2>
            <Link href="/dashboard/orders" style={{ fontSize: 13, color: "#10B981" }}>
              Voir tout →
            </Link>
          </div>

          <div className="rounded-2xl overflow-hidden" style={card3D}>
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center">
                <p style={{ fontSize: 14, color: "#8A8896" }}>Aucune commande pour l&apos;instant.</p>
              </div>
            ) : (
              recentOrders.map((order, idx) => {
                const name = order.client?.full_name ?? "—";
                const dot = STATUS_DOT[order.status];
                const isLast = idx === recentOrders.length - 1;
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="w-full flex items-center gap-3 px-4 active:opacity-60 transition-opacity"
                    style={{
                      paddingTop: 14,
                      paddingBottom: 14,
                      ...(!isLast && { borderBottom: "0.5px solid rgba(255,255,255,0.04)" }),
                    }}
                  >
                    <div
                      className={`flex items-center justify-center rounded-xl text-white font-bold shrink-0 ${avatarColor(name)}`}
                      style={{ width: 36, height: 36, fontSize: 13, boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}
                    >
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, color: "#FFFFFF", fontWeight: 500 }} className="truncate leading-tight">
                        {name}
                      </p>
                      <p style={{ fontSize: 11, color: "#4A4B55" }} className="font-mono mt-0.5">
                        {order.reference}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p style={{ fontSize: 13, color: "#FFFFFF", fontWeight: 700 }}>
                        {formatCurrency(order.total_amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#8A8896" }}>{dot.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* ── Desktop — table ──────────────────────────────────── */}
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Dernières commandes</h2>
                <span className="text-sm text-gray-500">{todayCount} aujourd&apos;hui</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrdersTable orders={orders} />
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
