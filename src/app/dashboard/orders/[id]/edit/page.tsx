import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ScrollMain } from "@/components/layout/scroll-main";
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
    <div className="flex flex-1 flex-col min-h-0 md:bg-transparent" style={{ background: "#1a1b1f" }}>
      <Header title={`Modifier ${(order as Order).reference}`} backHref={`/dashboard/orders/${id}`} hideBell />
      <ScrollMain className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-5 pb-52 md:p-6">
        <div className="mx-auto max-w-3xl">
          <OrderEditForm order={order as Order} />
        </div>
      </ScrollMain>
    </div>
  );
}
