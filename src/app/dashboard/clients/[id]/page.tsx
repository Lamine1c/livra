import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ClientEditForm } from "@/components/clients/client-edit-form";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { formatDate, WILAYAS, formatCurrency } from "@/lib/utils";
import { Client, Order } from "@/types";
import { Phone, MapPin } from "lucide-react";

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
    <div className="flex flex-1 flex-col bg-[#0D0D0D] md:bg-transparent">
      <Header title={client.full_name} />

      <main className="flex-1 pt-5 px-4 pb-40 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">

          {/* Informations + supprimer */}
          <div className="rounded-xl border border-[#252525] bg-[#161618] md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                Informations
              </h2>
              <DeleteClientButton clientId={client.id} />
            </div>
            <div className="px-4 py-4 md:px-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#8A8780] md:text-gray-600">
                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500 md:text-gray-400" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#8A8780] md:text-gray-600">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500 md:text-gray-400" />
                <span>
                  {client.address}, {client.commune},{" "}
                  {WILAYAS[client.wilaya] ?? client.wilaya}
                </span>
              </div>
              <p className="text-xs text-[#8A8780]/70 md:text-gray-400">
                Client depuis le {formatDate(client.created_at)}
              </p>
            </div>
          </div>

          {/* Modifier */}
          <div className="rounded-xl border border-[#252525] bg-[#161618] md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100">
              <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                Modifier
              </h2>
            </div>
            <div className="px-4 py-4 md:px-6">
              <ClientEditForm client={client} />
            </div>
          </div>

          {/* Commandes */}
          {orders && orders.length > 0 && (
            <div className="rounded-xl border border-[#252525] bg-[#161618] md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100">
                <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">
                  Commandes ({orders.length})
                </h2>
              </div>
              <div className="divide-y divide-[#252525] md:divide-gray-100">
                {(
                  orders as Pick<
                    Order,
                    "id" | "reference" | "status" | "total_amount" | "created_at"
                  >[]
                ).map((o) => (
                  <Link
                    key={o.id}
                    href={`/dashboard/orders/${o.id}`}
                    className="flex items-center justify-between px-4 py-3 md:px-6 hover:bg-[#1e1e20] md:hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-mono text-[#F0EDE8] md:text-gray-900">
                        {o.reference}
                      </p>
                      <p className="text-xs text-[#8A8780] md:text-gray-500">
                        {formatDate(o.created_at)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#F0EDE8] md:text-gray-900">
                      {formatCurrency(o.total_amount)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
