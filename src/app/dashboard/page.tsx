import Link from "next/link";
import { ShoppingCart, Users, TrendingUp, Clock, Plus, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";

// Couleur de l'avatar lettre basée sur la première lettre du nom
function avatarColor(name: string): string {
  const palette = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-rose-500",
    "bg-amber-500",
  ];
  return palette[name.toUpperCase().charCodeAt(0) % palette.length];
}

// Status badges mobile (fond sombre)
const MOBILE_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: "En attente", cls: "bg-orange-500/15 text-orange-400" },
  confirmed:  { label: "Confirmée",  cls: "bg-blue-500/15 text-blue-400" },
  processing: { label: "En cours",   cls: "bg-blue-500/15 text-blue-400" },
  shipped:    { label: "En cours",   cls: "bg-blue-500/15 text-blue-400" },
  delivered:  { label: "Livrée",     cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled:  { label: "Annulée",    cls: "bg-red-500/15 text-red-400" },
  returned:   { label: "Retournée",  cls: "bg-[#252525] text-[#8A8780]" },
};

// Stats config
const STATS_CONFIG = [
  {
    key: "orders",
    label: "Commandes",
    icon: ShoppingCart,
    mobileCls: "bg-blue-500/15 text-blue-400",
    desktopCls: "text-emerald-600",
  },
  {
    key: "pending",
    label: "En attente",
    icon: Clock,
    mobileCls: "bg-orange-500/15 text-orange-400",
    desktopCls: "text-yellow-600",
  },
  {
    key: "clients",
    label: "Clients",
    icon: Users,
    mobileCls: "bg-violet-500/15 text-violet-400",
    desktopCls: "text-blue-600",
  },
  {
    key: "revenue",
    label: "CA total",
    icon: TrendingUp,
    mobileCls: "bg-emerald-500/15 text-emerald-400",
    desktopCls: "text-emerald-600",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [ordersResult, clientsCountResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*, client:clients(*)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id),
  ]);

  const orders = (ordersResult.data as Order[]) ?? [];
  const totalClients = clientsCountResult.count ?? 0;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at.startsWith(today)).length;

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)
      ?.split(" ")[0] ?? "";

  const statsValues: Record<string, string | number> = {
    orders: orders.length,
    pending: pendingOrders,
    clients: totalClients,
    revenue: formatCurrency(totalRevenue),
  };

  return (
    <div className="flex flex-1 flex-col bg-[#0D0D0D] md:bg-transparent">
      {/* ── Desktop header ───────────────────────────────────── */}
      <div className="hidden md:block">
        <Header
          title="Tableau de bord"
          subtitle={`Bonjour ${user?.user_metadata?.full_name ?? ""}`}
        />
      </div>

      {/* ── Mobile header ────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 pt-6 pb-4">
        <div>
          <p className="text-[#8A8780] text-sm">Bonjour 👋</p>
          <h1 className="text-[#F0EDE8] text-xl font-bold leading-tight mt-0.5">
            {firstName || "Bienvenue"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-[#161618] border border-[#252525] flex items-center justify-center text-[#8A8780]">
            <Bell className="h-4 w-4" />
          </button>
          <Link
            href="/dashboard/orders/new"
            className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* ── Stats — 2×2 mobile, 4-col desktop ──────────────── */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
          {STATS_CONFIG.map(({ key, label, icon: Icon, mobileCls, desktopCls }) => (
            <div
              key={key}
              className="rounded-xl border border-[#252525] bg-[#161618] p-4
                         md:rounded-xl md:border-gray-200 md:bg-white md:shadow-sm"
            >
              {/* Mobile layout */}
              <div className="md:hidden flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${mobileCls}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[#8A8780] text-xs">{label}</p>
                  <p className="text-[#F0EDE8] text-xl font-bold mt-0.5 leading-none">
                    {statsValues[key]}
                  </p>
                </div>
              </div>
              {/* Desktop layout */}
              <div className="hidden md:flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {statsValues[key]}
                  </p>
                </div>
                <div className={`rounded-xl bg-gray-50 p-3 ${desktopCls}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Orders — cards mobile, table desktop ────────────── */}

        {/* Mobile order cards */}
        <div className="md:hidden space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#F0EDE8] font-semibold text-sm">
              Dernières commandes
            </h2>
            <span className="text-[#8A8780] text-xs">
              {todayOrders} aujourd'hui
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#8A8780] text-sm">Aucune commande pour l'instant.</p>
            </div>
          ) : (
            orders.map((order) => {
              const name = order.client?.full_name ?? "—";
              const initial = name.slice(0, 1).toUpperCase();
              const ms = MOBILE_STATUS[order.status];
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[#252525] bg-[#161618] p-3.5 active:opacity-70 transition-opacity"
                >
                  {/* Avatar lettre */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(name)}`}
                  >
                    {initial}
                  </div>

                  {/* Nom + ref */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F0EDE8] font-medium text-sm leading-tight truncate">
                      {name}
                    </p>
                    <p className="text-[#8A8780] text-xs font-mono mt-0.5">
                      {order.reference}
                    </p>
                  </div>

                  {/* Montant + status */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-[#F0EDE8] text-sm font-semibold">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full leading-none ${ms.cls}`}
                    >
                      {ms.label}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Desktop order table */}
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Dernières commandes
                </h2>
                <span className="text-sm text-gray-500">
                  {todayOrders} aujourd'hui
                </span>
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
