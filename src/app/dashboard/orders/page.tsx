import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";

interface SearchParams {
  status?: string;
}

// Avatar lettre
function avatarColor(name: string): string {
  const p = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-orange-500","bg-rose-500","bg-amber-500"];
  return p[name.toUpperCase().charCodeAt(0) % p.length];
}

// Status mobile
const MOBILE_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: "En attente", cls: "bg-orange-500/15 text-orange-400" },
  confirmed:  { label: "Confirmée",  cls: "bg-blue-500/15 text-blue-400" },
  processing: { label: "En cours",   cls: "bg-blue-500/15 text-blue-400" },
  shipped:    { label: "En cours",   cls: "bg-blue-500/15 text-blue-400" },
  delivered:  { label: "Livrée",     cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled:  { label: "Annulée",    cls: "bg-red-500/15 text-red-400" },
  returned:   { label: "Retournée",  cls: "bg-[#252525] text-[#8A8780]" },
};

const STATUS_FILTERS = [
  { label: "Toutes",     value: "" },
  { label: "En attente", value: "pending" },
  { label: "Confirmées", value: "confirmed" },
  { label: "Expédiées",  value: "shipped" },
  { label: "Livrées",    value: "delivered" },
  { label: "Annulées",   value: "cancelled" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const { status } = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("orders")
    .select("*, client:clients(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as OrderStatus);

  const { data: orders } = await query;
  const list = (orders as Order[]) ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-[#0D0D0D] md:bg-transparent">
      <Header title="Commandes" />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filtres + bouton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Pills — scroll horizontal sur mobile */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-webkit-scrollbar:hidden]">
            {STATUS_FILTERS.map((f) => {
              const active = status === f.value || (!status && !f.value);
              return (
                <Link
                  key={f.value}
                  href={f.value ? `/dashboard/orders?status=${f.value}` : "/dashboard/orders"}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "bg-[#161618] text-[#8A8780] border border-[#252525] md:bg-white md:text-gray-600 md:border-gray-200 hover:border-emerald-500/50 md:hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>

          <Link href="/dashboard/orders/new" className="shrink-0">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Button>
          </Link>
        </div>

        {/* Mobile — liste de cards */}
        <div className="md:hidden space-y-2">
          {list.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#8A8780]">Aucune commande.</p>
          ) : (
            list.map((order) => {
              const name = order.client?.full_name ?? "—";
              const ms = MOBILE_STATUS[order.status];
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[#252525] bg-[#161618] p-3.5 active:opacity-70 transition-opacity"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(name)}`}>
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F0EDE8] font-medium text-sm leading-tight truncate">{name}</p>
                    <p className="text-[#8A8780] text-xs font-mono mt-0.5">{order.reference}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-[#F0EDE8] text-sm font-semibold">{formatCurrency(order.total_amount)}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full leading-none ${ms.cls}`}>
                      {ms.label}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Desktop — tableau */}
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-0">
              <OrdersTable orders={list} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
