import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ScrollMain } from "@/components/layout/scroll-main";
import { ClientEditForm } from "@/components/clients/client-edit-form";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { formatDate, WILAYAS, formatCurrency } from "@/lib/utils";
import { Client, Order } from "@/types";
import { Phone, MapPin } from "lucide-react";

const BG = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK = "#0c0d11";
const OFF_WHITE = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.4)";

const sectionCard = {
  background: BG,
  borderRadius: 18,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
  padding: 18,
  marginBottom: 28,
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: clientData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!clientData) notFound();

  const client = clientData as Client;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, reference, status, total_amount, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col min-h-0 md:bg-transparent" style={{ background: BG }}>
      <Header title={client.full_name} backHref="/dashboard/clients" hideBell />

      <ScrollMain className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-5 pb-52 md:p-6">
        <div className="mx-auto max-w-2xl">

          {/* Informations */}
          <div style={sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE }}>Informations</h2>
              <DeleteClientButton clientId={client.id} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: MUTED }} />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
                <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: MUTED }} />
                <span>
                  {client.address}, {client.commune},{" "}
                  {WILAYAS[client.wilaya] ?? client.wilaya}
                </span>
              </div>
              <p className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
                Client depuis le {formatDate(client.created_at)}
              </p>
            </div>
          </div>

          {/* Modifier */}
          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>Modifier</h2>
            <ClientEditForm client={client} />
          </div>

          {/* Commandes */}
          {orders && orders.length > 0 && (
            <div style={sectionCard}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>
                Commandes ({orders.length})
              </h2>
              <div className="space-y-3">
                {(orders as Pick<Order, "id" | "reference" | "status" | "total_amount" | "created_at">[]).map((o) => (
                  <Link
                    key={o.id}
                    href={`/dashboard/orders/${o.id}`}
                    className="flex items-center justify-between rounded-[12px] px-3 py-3 transition-colors"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div>
                      <p className="text-sm font-mono" style={{ color: OFF_WHITE }}>{o.reference}</p>
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>{formatDate(o.created_at)}</p>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: OFF_WHITE }}>
                      {formatCurrency(o.total_amount)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </ScrollMain>
    </div>
  );
}
