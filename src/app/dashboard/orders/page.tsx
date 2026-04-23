import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus } from "@/types";

interface SearchParams {
  status?: string;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const { status } = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("orders")
    .select("*, client:clients(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status as OrderStatus);
  }

  const { data: orders } = await query;

  const STATUS_FILTERS = [
    { label: "Toutes", value: "" },
    { label: "En attente", value: "pending" },
    { label: "Confirmées", value: "confirmed" },
    { label: "Expédiées", value: "shipped" },
    { label: "Livrées", value: "delivered" },
    { label: "Annulées", value: "cancelled" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Commandes" />
      <main className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <Link
                key={f.value}
                href={f.value ? `/dashboard/orders?status=${f.value}` : "/dashboard/orders"}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  status === f.value || (!status && !f.value)
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <Link href="/dashboard/orders/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <OrdersTable orders={(orders as Order[]) ?? []} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
