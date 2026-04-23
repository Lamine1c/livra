import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import { formatCurrency, formatDate, WILAYAS } from "@/lib/utils";
import { Order } from "@/types";

export default async function OrderDetailPage({
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

  const o = order as Order;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title={`Commande ${o.reference}`} />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={o.status} />
            <OrderStatusSelect orderId={o.id} currentStatus={o.status} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Client</h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">
                  {o.client?.full_name}
                </p>
                <p className="text-gray-600">{o.client?.phone}</p>
                <p className="text-gray-600">{o.client?.address}</p>
                <p className="text-gray-600">
                  {o.client?.commune},{" "}
                  {WILAYAS[o.client?.wilaya ?? ""] ?? o.client?.wilaya}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Informations</h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Référence</span>
                  <span className="font-mono font-medium">{o.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>{formatDate(o.created_at)}</span>
                </div>
                {o.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">N° suivi</span>
                    <span className="font-mono">{o.tracking_number}</span>
                  </div>
                )}
                {o.notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-500">Notes</p>
                    <p className="mt-1 text-gray-700">{o.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Articles</h2>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3">Produit</th>
                    <th className="px-6 py-3 text-right">Qté</th>
                    <th className="px-6 py-3 text-right">Prix unitaire</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {o.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm text-gray-500">
                      Sous-total
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatCurrency(o.total_amount - o.delivery_fee)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm text-gray-500">
                      Frais de livraison
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatCurrency(o.delivery_fee)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-right font-semibold">
                      Total
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-emerald-600">
                      {formatCurrency(o.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
