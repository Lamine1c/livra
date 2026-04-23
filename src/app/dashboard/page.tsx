import { ShoppingCart, Users, TrendingUp, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/types";

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

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Tableau de bord"
        subtitle={`Bonjour ${user?.user_metadata?.full_name ?? ""}`}
      />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total commandes"
            value={orders.length}
            icon={ShoppingCart}
          />
          <StatsCard
            title="En attente"
            value={pendingOrders}
            icon={Clock}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Clients"
            value={totalClients}
            icon={Users}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Chiffre d'affaires"
            value={formatCurrency(totalRevenue)}
            icon={TrendingUp}
            iconColor="text-emerald-600"
          />
        </div>

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
      </main>
    </div>
  );
}
