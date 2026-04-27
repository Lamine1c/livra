import Link from "next/link";
import { Plus } from "lucide-react";
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

  const cta = (
    <Link
      href="/dashboard/clients/new"
      className="inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold whitespace-nowrap transition-transform active:scale-[0.97]"
      style={{
        background: "#1a1b1f",
        color: "#10B981",
        boxShadow: "-12px -12px 20px #232429, 12px 12px 20px #0c0d11",
      }}
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Nouveau client</span>
      <span className="sm:hidden">Nouveau</span>
    </Link>
  );

  return (
    <div className="w-full flex flex-1 flex-col min-h-0" style={{ background: "#1a1b1f" }}>
      <Header
        title="Clients"
        subtitle={`${list.length} client${list.length > 1 ? "s" : ""}`}
        rightContent={cta}
      />
      <ClientsClient clients={list} />
    </div>
  );
}
