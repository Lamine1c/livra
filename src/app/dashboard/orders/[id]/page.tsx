import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OrderActionsMenu } from "@/components/orders/order-actions-menu";
import { OrderStatusRow } from "@/components/orders/order-status-row";
import { OtpVerifyWidget } from "@/components/orders/otp-verify-widget";
import { YalidineButton } from "@/components/orders/yalidine-button";
import { ManualTrackingForm } from "@/components/orders/manual-tracking-form";
import { formatCurrency, formatDate, WILAYAS } from "@/lib/utils";
import { Order } from "@/types";

const DC = "rounded-xl border border-[#252525] bg-[#161618] md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden";
const DCH = "px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100";
const DCB = "px-4 py-4 md:px-6";

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
    <div className="flex flex-1 flex-col bg-[#0D0D0D] md:bg-transparent">
      <Header title={`Commande ${o.reference}`} rightContent={<OrderActionsMenu orderId={o.id} />} />
      <main className="flex-1 overflow-x-hidden pt-5 px-4 pb-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">

          <OrderStatusRow orderId={o.id} currentStatus={o.status} />

          {/* OTP */}
          {!o.otp_verified_at && o.status === "pending" && o.client && (
            <div className={DC}>
              <div className={DCH}>
                <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                  Vérification WhatsApp
                </h2>
                <p className="text-sm text-[#8A8780] md:text-gray-500">
                  Le client doit confirmer sa commande via le code reçu.
                </p>
              </div>
              <div className={DCB}>
                <OtpVerifyWidget
                  orderId={o.id}
                  clientPhone={o.client.phone}
                  clientName={o.client.full_name}
                />
              </div>
            </div>
          )}

          {/* Yalidine */}
          <div className={DC}>
            <div className={DCH}>
              <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                Livraison Yalidine
              </h2>
              {!o.tracking_number && (
                <p className="text-sm text-[#8A8780] md:text-gray-500">
                  Créez le bon de livraison et obtenez le numéro de suivi en 1 clic.
                </p>
              )}
            </div>
            <div className={DCB}>
              <YalidineButton orderId={o.id} trackingNumber={o.tracking_number} />
            </div>
          </div>

          {/* Suivi manuel */}
          <div className={DC}>
            <div className={DCH}>
              <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                Suivi de livraison
              </h2>
              <p className="text-sm text-[#8A8780] md:text-gray-500">
                Entrez le numéro de suivi si vous utilisez un autre transporteur.
              </p>
            </div>
            <div className={DCB}>
              <ManualTrackingForm
                orderId={o.id}
                initialTracking={o.tracking_number}
                initialCarrier={o.carrier}
              />
            </div>
          </div>

          {/* Client + Informations */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            <div className={DC}>
              <div className={DCH}>
                <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">Client</h2>
              </div>
              <div className={`${DCB} space-y-2 text-sm`}>
                <p className="font-medium text-[#F0EDE8] md:text-gray-900">
                  {o.client?.full_name}
                </p>
                <p className="text-[#8A8780] md:text-gray-600">{o.client?.phone}</p>
                <p className="text-[#8A8780] md:text-gray-600">{o.client?.address}</p>
                <p className="text-[#8A8780] md:text-gray-600">
                  {o.client?.commune},{" "}
                  {WILAYAS[o.client?.wilaya ?? ""] ?? o.client?.wilaya}
                </p>
              </div>
            </div>

            <div className={DC}>
              <div className={DCH}>
                <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                  Informations
                </h2>
              </div>
              <div className={`${DCB} space-y-2 text-sm`}>
                <div className="flex justify-between">
                  <span className="text-[#8A8780] md:text-gray-500">Référence</span>
                  <span className="font-mono font-medium text-[#F0EDE8] md:text-gray-900">
                    {o.reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8780] md:text-gray-500">Date</span>
                  <span className="text-[#F0EDE8] md:text-gray-900">
                    {formatDate(o.created_at)}
                  </span>
                </div>
                {o.notes && (
                  <div className="pt-2 border-t border-[#252525] md:border-gray-100">
                    <p className="text-[#8A8780] md:text-gray-500">Notes</p>
                    <p className="mt-1 text-[#F0EDE8] md:text-gray-700">{o.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className={DC}>
            <div className={DCH}>
              <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">Articles</h2>
            </div>

            {/* Mobile : liste verticale */}
            <div className="md:hidden divide-y divide-[#252525]">
              {o.items?.map((item) => (
                <div key={item.id} className="flex items-start justify-between px-4 py-3 gap-3">
                  <p className="text-sm text-[#F0EDE8] flex-1 min-w-0 truncate">
                    {item.product_name}
                  </p>
                  <p className="text-sm text-[#8A8780] shrink-0 whitespace-nowrap text-right">
                    {item.quantity} × {formatCurrency(item.unit_price)}
                    <br />
                    <span className="font-semibold text-[#F0EDE8]">
                      = {formatCurrency(item.total_price)}
                    </span>
                  </p>
                </div>
              ))}
              <div className="px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8A8780]">Sous-total</span>
                  <span className="font-medium text-[#F0EDE8]">
                    {formatCurrency(o.total_amount - o.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8A8780]">Livraison</span>
                  <span className="font-medium text-[#F0EDE8]">
                    {formatCurrency(o.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#252525]">
                  <span className="text-[#F0EDE8]">Total</span>
                  <span className="text-emerald-400">{formatCurrency(o.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Desktop : tableau classique */}
            <div className="hidden md:block">
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
                      <td className="px-6 py-3 text-gray-900">{item.product_name}</td>
                      <td className="px-6 py-3 text-right text-gray-600">{item.quantity}</td>
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
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
