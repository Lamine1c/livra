import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OrdersClient } from "@/components/orders/orders-client";
import { Order } from "@/types";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, client:clients(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (orders as Order[]) ?? [];

  return (
    <div className="w-full flex flex-1 flex-col min-h-0" style={{ background: "#1a1b1f" }}>
      <Header title="Commandes" hideBell />
      <OrdersClient orders={list} />
    </div>
  );
}
