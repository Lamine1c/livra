import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ClientsClient } from "@/components/clients/clients-client";
import { Client } from "@/types";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user!.id)
    .order("full_name");

  const list = (clients as Client[]) ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-[#0D0D0D] md:bg-transparent">
      <Header
        title="Clients"
        subtitle={`${list.length} client${list.length > 1 ? "s" : ""}`}
      />
      <ClientsClient clients={list} />
    </div>
  );
}
