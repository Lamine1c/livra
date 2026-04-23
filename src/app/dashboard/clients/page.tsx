import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { WILAYAS, formatDate } from "@/lib/utils";
import { Client } from "@/types";
import { MapPin, Phone } from "lucide-react";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user!.id)
    .order("full_name");

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header
        title="Clients"
        subtitle={`${clients?.length ?? 0} clients`}
      />
      <main className="flex-1 p-6">
        {!clients?.length ? (
          <div className="py-16 text-center text-gray-500">
            <p className="text-sm">
              Aucun client. Créez votre première commande pour ajouter un client.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(clients as Client[]).map((client) => (
              <Card key={client.id}>
                <CardContent className="pt-4">
                  <p className="font-semibold text-gray-900">{client.full_name}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {client.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {client.commune},{" "}
                      {WILAYAS[client.wilaya] ?? client.wilaya}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    Depuis le {formatDate(client.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
