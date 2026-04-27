import Link from "next/link";
import { ShoppingCart, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ScrollMain } from "@/components/layout/scroll-main";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";

// ── Palette A2-S1 audacieux ───────────────────────────────────
const BG           = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK  = "#0c0d11";
const AVATAR_BG    = "#282a2f";
const AVATAR_LIGHT = "#242630";
const AVATAR_DARK  = "#0a0b0f";
const EMERALD      = "#10B981";
const OFF_WHITE    = "#F5F0E8";

// ── Card styles — outset ──────────────────────────────────────
const cardNeumorphic = {
  background: BG,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
};

const cardNeumorphicGlow = {
  background: BG,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}, 0 0 28px rgba(16,185,129,0.25)`,
};

// ── Avatar box styles — outset ────────────────────────────────
const avatarStyle = {
  background: AVATAR_BG,
  boxShadow: `-6px -6px 12px ${AVATAR_LIGHT}, 6px 6px 12px ${AVATAR_DARK}`,
};

const avatarStyleGlow = {
  background: AVATAR_BG,
  boxShadow: `-6px -6px 12px ${AVATAR_LIGHT}, 6px 6px 12px ${AVATAR_DARK}, inset 0 0 10px rgba(16,185,129,0.2)`,
};

const STATUS_DOT: Record<OrderStatus, { color: string; label: string }> = {
  pending:    { color: "#F59E0B",               label: "En attente" },
  confirmed:  { color: "rgba(245,240,232,0.5)", label: "Confirmée" },
  processing: { color: "rgba(245,240,232,0.5)", label: "En cours" },
  shipped:    { color: "rgba(245,240,232,0.5)", label: "En cours" },
  delivered:  { color: EMERALD,                 label: "Livrée" },
  cancelled:  { color: "#F87171",               label: "Annulée" },
  returned:   { color: "#8A8896",               label: "Retournée" },
};

// Config stats desktop (inchangée)
const STATS_CONFIG = [
  { key: "orders",  label: "Commandes",  icon: ShoppingCart, desktopCls: "text-emerald-600" },
  { key: "pending", label: "En attente", icon: Clock,        desktopCls: "text-yellow-600" },
  { key: "clients", label: "Clients",    icon: Users,        desktopCls: "text-blue-600" },
  { key: "revenue", label: "CA total",   icon: TrendingUp,   desktopCls: "text-emerald-600" },
];

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

  const MUTED = "rgba(245,240,232,0.4)";

  const revenueDeltaColor =
    yesterdayRevenue === 0
      ? todayRevenue > 0 ? EMERALD : MUTED
      : todayRevenue >= yesterdayRevenue ? EMERALD : MUTED;

  const mobileStats = [
    {
      key: "orders",
      label: "Commandes",
      Icon: ShoppingCart,
      value: orders.length,
      delta: todayCount > 0 ? `+${todayCount} aujourd'hui` : "Aucune aujourd'hui",
      deltaColor: todayCount > 0 ? EMERALD : MUTED,
      iconStyle: avatarStyle,
      iconColor: OFF_WHITE,
      glow: false,
    },
    {
      key: "pending",
      label: "En attente",
      Icon: Clock,
      value: pendingOrders.length,
      delta: "À traiter",
      deltaColor: "#F59E0B",
      iconStyle: avatarStyle,
      iconColor: OFF_WHITE,
      glow: false,
    },
    {
      key: "delivered",
      label: "Livrées",
      Icon: CheckCircle,
      value: deliveredOrders.length,
      delta: todayDelivered > 0 ? `+${todayDelivered} aujourd'hui` : "Aucune aujourd'hui",
      deltaColor: todayDelivered > 0 ? EMERALD : MUTED,
      iconStyle: avatarStyle,
      iconColor: OFF_WHITE,
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
      iconStyle: avatarStyleGlow,
      iconColor: EMERALD,
      glow: true,
    },
  ];

  return (
    <div
      className="flex flex-1 flex-col min-h-0"
      style={{ background: BG }}
    >

      {/* ── Desktop header ───────────────────────────────────── */}
      <div className="hidden md:block">
        <Header
          title="Tableau de bord"
          subtitle={`Bonjour ${user?.user_metadata?.full_name ?? ""}`}
        />
      </div>

      {/* ── Mobile header ────────────────────────────────────── */}
      <div
        className="md:hidden sticky top-0 z-20 flex items-center justify-between px-5 pb-6"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 20px)",
          background: "linear-gradient(to bottom, #1a1b1f 0%, #1a1b1f 60%, transparent 100%)",
        }}
      >
        <div>
          <p style={{ fontSize: 12, color: "#8A8896", lineHeight: 1 }}>Bonjour 👋</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: OFF_WHITE, lineHeight: 1.15, marginTop: 4 }}>
            {firstName || "Bienvenue"}
          </h1>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1 }}>
            Voici votre journée
          </p>
        </div>
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 48, height: 48, fontSize: 18, fontWeight: 500,
            color: OFF_WHITE,
            background: AVATAR_BG,
            boxShadow: "4px 4px 10px rgba(0,0,0,0.5)",
          }}
        >
          {(firstName || user?.email || "?")[0].toUpperCase()}
        </div>
      </div>

      <ScrollMain className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-5 pb-52 md:p-6 space-y-6 md:space-y-6">

        {/* ── Mobile stats 2×2 ───────────────────────────────── */}
        <div className="md:hidden grid grid-cols-2 gap-[18px] pt-4 mt-6">
          {mobileStats.map(({ key, label, Icon, value, delta, deltaColor, iconStyle, iconColor, glow }) => (
            <div
              key={key}
              className="rounded-[18px] flex flex-col gap-2"
              style={{ ...(glow ? cardNeumorphicGlow : cardNeumorphic), padding: 18 }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-[10px]"
                style={{ width: 40, height: 40, ...iconStyle }}
              >
                <Icon style={{ width: 16, height: 16, color: iconColor }} />
              </div>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(245,240,232,0.42)" }}>
                {label}
              </p>
              <p style={{ fontSize: key === "revenue" ? 22 : 30, fontWeight: 700, color: OFF_WHITE, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: 15, fontWeight: 700, color: OFF_WHITE }}>
              Dernières commandes
            </h2>
            <Link href="/dashboard/orders" style={{ fontSize: 13, color: "rgba(245,240,232,0.5)", fontWeight: 500 }}>
              Voir tout →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <p style={{ fontSize: 14, color: "#8A8896" }}>Aucune commande pour l&apos;instant.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {recentOrders.map((order) => {
                const name = order.client?.full_name ?? "—";
                const dot = STATUS_DOT[order.status];
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="w-full flex items-center gap-3 rounded-[18px] active:scale-[0.99] transition-all"
                    style={{ ...cardNeumorphic, padding: "14px 14px" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-[10px] shrink-0 font-bold"
                      style={{
                        width: 40, height: 40, fontSize: 14,
                        color: OFF_WHITE,
                        background: AVATAR_BG,
                        boxShadow: "4px 4px 10px rgba(0,0,0,0.5)",
                      }}
                    >
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, color: OFF_WHITE, fontWeight: 500 }} className="truncate leading-tight">
                        {name}
                      </p>
                      <p style={{ fontSize: 11, color: MUTED }} className="font-mono mt-0.5">
                        {order.reference}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p style={{ fontSize: 13, color: OFF_WHITE, fontWeight: 700 }}>
                        {formatCurrency(order.total_amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#8A8896" }}>{dot.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
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

      </ScrollMain>
    </div>
  );
}
