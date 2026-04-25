import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { WILAYAS, formatDate } from "@/lib/utils";
import { Client } from "@/types";
import { MapPin, Phone } from "lucide-react";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user!.id)
    .order("full_name");

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-[#0D0D0D] md:bg-transparent">
      <Header
        title="Clients"
        subtitle={`${clients?.length ?? 0} client${(clients?.length ?? 0) > 1 ? "s" : ""}`}
      />

      <main className="flex-1 p-4 md:p-6">
        {!clients?.length ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#8A8780] md:text-gray-500">
              Aucun client. Créez votre première commande pour ajouter un client.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(clients as Client[]).map((client) => (
              <div
                key={client.id}
                className="rounded-xl border border-[#252525] bg-[#161618] p-4 md:rounded-xl md:border-gray-200 md:bg-white md:shadow-sm"
              >
                <p className="font-semibold text-[#F0EDE8] md:text-gray-900">
                  {client.full_name}
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-[#8A8780] md:text-gray-600">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500 md:text-gray-400" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8A8780] md:text-gray-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500 md:text-gray-400" />
                    <span className="truncate">
                      {client.commune},{" "}
                      {WILAYAS[client.wilaya] ?? client.wilaya}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#8A8780]/70 md:text-gray-400">
                  Depuis le {formatDate(client.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
