import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ScrollMain } from "@/components/layout/scroll-main";
import { OrderActionsMenu } from "@/components/orders/order-actions-menu";
import { OrderStatusRow } from "@/components/orders/order-status-row";
import { TrackingTimeline } from "@/components/orders/tracking-timeline";
import { OtpVerifyWidget } from "@/components/orders/otp-verify-widget";
import { YalidineButton } from "@/components/orders/yalidine-button";
import { ManualTrackingForm } from "@/components/orders/manual-tracking-form";
import { formatCurrency, formatDate, WILAYAS } from "@/lib/utils";
import { Order } from "@/types";

const BG = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK = "#0c0d11";
const OFF_WHITE = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.4)";
const EMERALD = "#10B981";

const sectionCard: React.CSSProperties = {
  background: BG,
  borderRadius: 18,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
  padding: 18,
  marginBottom: 28,
};

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
    <div className="flex flex-1 flex-col min-h-0 md:bg-transparent" style={{ background: BG }}>
      <Header title={`Commande ${o.reference}`} backHref="/dashboard/orders" hideBell rightContent={<OrderActionsMenu orderId={o.id} />} />
      <ScrollMain className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-5 pb-52 md:p-6">
        <div className="mx-auto max-w-3xl">

          <div style={{ marginBottom: 28 }}>
            <OrderStatusRow orderId={o.id} currentStatus={o.status} />
          </div>

          {/* OTP */}
          {!o.otp_verified_at && o.status === "pending" && o.client && (
            <div style={sectionCard}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 4 }}>
                Vérification WhatsApp
              </h2>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
                Le client doit confirmer sa commande via le code reçu.
              </p>
              <OtpVerifyWidget
                orderId={o.id}
                clientPhone={o.client.phone}
                clientName={o.client.full_name}
              />
            </div>
          )}

          {/* Yalidine */}
          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 4 }}>
              Livraison Yalidine
            </h2>
            {!o.tracking_number && (
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
                Créez le bon de livraison et obtenez le numéro de suivi en 1 clic.
              </p>
            )}
            <YalidineButton orderId={o.id} trackingNumber={o.tracking_number} />
          </div>

          {/* Suivi manuel */}
          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 4 }}>
              Suivi de livraison
            </h2>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
              Entrez le numéro de suivi si vous utilisez un autre transporteur.
            </p>
            <ManualTrackingForm
              orderId={o.id}
              initialTracking={o.tracking_number}
              initialCarrier={o.carrier}
            />
          </div>

          {/* Client + Informations */}
          <div className="grid gap-7 md:grid-cols-2" style={{ marginBottom: 28 }}>
            <div style={{ ...sectionCard, marginBottom: 0 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>Client</h2>
              <div className="space-y-2 text-sm">
                <p style={{ color: OFF_WHITE, fontWeight: 500 }}>{o.client?.full_name}</p>
                <p style={{ color: MUTED }}>{o.client?.phone}</p>
                <p style={{ color: MUTED }}>{o.client?.address}</p>
                <p style={{ color: MUTED }}>
                  {o.client?.commune},{" "}
                  {WILAYAS[o.client?.wilaya ?? ""] ?? o.client?.wilaya}
                </p>
              </div>
            </div>

            <div style={{ ...sectionCard, marginBottom: 0 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>Informations</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: MUTED }}>Référence</span>
                  <span className="font-mono font-medium" style={{ color: OFF_WHITE }}>{o.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: MUTED }}>Date</span>
                  <span style={{ color: OFF_WHITE }}>{formatDate(o.created_at)}</span>
                </div>
                {o.notes && (
                  <div style={{ paddingTop: 8, marginTop: 8, borderTop: "1px solid rgba(245,240,232,0.08)" }}>
                    <p style={{ color: MUTED }}>Notes</p>
                    <p style={{ color: OFF_WHITE, marginTop: 4 }}>{o.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Articles */}
          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>Articles</h2>

            {/* Mobile */}
            <div className="md:hidden space-y-0">
              {o.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between py-3 gap-3"
                  style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                >
                  <p className="text-sm flex-1 min-w-0 truncate" style={{ color: OFF_WHITE }}>
                    {item.product_name}
                  </p>
                  <p className="text-sm shrink-0 whitespace-nowrap text-right" style={{ color: MUTED }}>
                    {item.quantity} × {formatCurrency(item.unit_price)}
                    <br />
                    <span className="font-semibold" style={{ color: OFF_WHITE }}>
                      = {formatCurrency(item.total_price)}
                    </span>
                  </p>
                </div>
              ))}
              <div className="space-y-1.5 pt-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: MUTED }}>Sous-total</span>
                  <span className="font-medium" style={{ color: OFF_WHITE }}>
                    {formatCurrency(o.total_amount - o.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: MUTED }}>Livraison</span>
                  <span className="font-medium" style={{ color: OFF_WHITE }}>
                    {formatCurrency(o.delivery_fee)}
                  </span>
                </div>
                <div
                  className="flex justify-between text-sm font-bold pt-2"
                  style={{ borderTop: "1px solid rgba(245,240,232,0.08)" }}
                >
                  <span style={{ color: OFF_WHITE }}>Total</span>
                  <span style={{ color: EMERALD }}>{formatCurrency(o.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Desktop */}
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
                      <td className="px-6 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm text-gray-500">Sous-total</td>
                    <td className="px-6 py-3 text-right font-medium">{formatCurrency(o.total_amount - o.delivery_fee)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm text-gray-500">Frais de livraison</td>
                    <td className="px-6 py-3 text-right font-medium">{formatCurrency(o.delivery_fee)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-3 text-right font-semibold">Total</td>
                    <td className="px-6 py-3 text-right font-bold text-emerald-600">{formatCurrency(o.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </ScrollMain>
    </div>
  );
}
