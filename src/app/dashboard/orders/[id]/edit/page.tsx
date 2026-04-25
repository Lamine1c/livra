import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OrderEditForm } from "@/components/orders/order-edit-form";
import { Order } from "@/types";

export default async function OrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, client:clients(*), items:order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-[#0D0D0D] md:bg-transparent">
      <Header title={`Modifier ${(order as Order).reference}`} />
      <main className="flex-1 overflow-x-hidden p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          <OrderEditForm order={order as Order} />
        </div>
      </main>
    </div>
  );
}
