"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Trash2, Check, MapPin, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types";
import { WILAYAS, formatDate } from "@/lib/utils";

interface ClientsClientProps {
  clients: Client[];
}

export function ClientsClient({ clients }: ClientsClientProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSheetOpen, setBulkSheetOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const clientIds = Array.from(selected);

    const { data: orderRows } = await supabase
      .from("orders")
      .select("id")
      .in("client_id", clientIds);

    if (orderRows?.length) {
      const orderIds = orderRows.map((o) => o.id);
      await supabase.from("order_items").delete().in("order_id", orderIds);
      await supabase.from("orders").delete().in("id", orderIds);
    }

    await supabase.from("clients").delete().in("id", clientIds);
    setBulkDeleting(false);
    setBulkSheetOpen(false);
    exitSelectMode();
    router.refresh();
  }

  if (!clients.length) {
    return (
      <main className="flex-1 overflow-x-hidden p-4 md:p-6">
        <EmptyClients />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-x-hidden p-4 md:p-6">

      {/* Barre Sélectionner / actif */}
      <div className="flex items-center justify-between mb-4">
        {selectMode ? (
          <>
            <p className="text-sm font-medium text-[#F0EDE8]">
              {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
            </p>
            <button onClick={exitSelectMode} className="text-sm text-[#8A8780]">
              Annuler
            </button>
          </>
        ) : (
          <button
            onClick={() => setSelectMode(true)}
            className="md:hidden ml-auto text-sm text-[#8A8780] hover:text-[#F0EDE8]"
          >
            Sélectionner
          </button>
        )}
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => {
          const isSelected = selected.has(client.id);
          return selectMode ? (
            <div
              key={client.id}
              onClick={() => toggleSelect(client.id)}
              className={`relative rounded-xl border p-4 cursor-pointer transition-colors ${
                isSelected
                  ? "border-emerald-500/50 bg-[#0A2A14]"
                  : "border-[#252525] bg-[#161618]"
              }`}
            >
              {/* Checkbox overlay */}
              <div
                className={`absolute top-3 left-3 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "border-[#10B981] bg-[#0A2A14]"
                    : "border-[#333] bg-transparent"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-[#10B981]" />}
              </div>
              <div className="pl-8">
                <p className="font-semibold text-[#F0EDE8]">{client.full_name}</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-[#8A8780]">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8A8780]">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">
                      {client.commune}, {WILAYAS[client.wilaya] ?? client.wilaya}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="rounded-xl border border-[#252525] bg-[#161618] p-4 md:border-gray-200 md:bg-white md:shadow-sm block hover:border-emerald-500/50 transition-colors"
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
            </Link>
          );
        })}
      </div>

      {/* Barre de sélection bulk */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-between border-t border-[#333] bg-[#1E1E20] px-4 py-3 md:bottom-0">
          <p className="text-sm text-[#F0EDE8]">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setBulkSheetOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[#F87171] bg-[#2D1010] px-4 py-2 text-sm font-medium text-[#F87171]"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      )}

      {/* Bulk delete bottom sheet */}
      {bulkSheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !bulkDeleting && setBulkSheetOpen(false)}
          />
          <div className="relative w-full rounded-t-[16px] bg-[#1A1A1C] pb-safe">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-[3px] w-8 rounded-full bg-[#444]" />
            </div>
            <div className="px-5 pb-6 pt-4 space-y-3">
              <p className="font-semibold text-[#F0EDE8]">
                Supprimer {selected.size} client{selected.size > 1 ? "s" : ""} ?
              </p>
              <p className="text-sm text-[#8A8780]">
                Leurs commandes seront aussi supprimées. Cette action est irréversible.
              </p>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="mt-2 w-full rounded-xl border border-[#F87171] bg-[#2D1010] px-4 py-3.5 text-sm font-semibold text-[#F87171] disabled:opacity-50"
              >
                {bulkDeleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
              <button
                onClick={() => setBulkSheetOpen(false)}
                disabled={bulkDeleting}
                className="w-full rounded-xl bg-[#252525] px-4 py-3.5 text-sm font-semibold text-[#8A8780]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function EmptyClients() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1E1E20]">
        <Users className="h-6 w-6 text-[#8A8780]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#F0EDE8]">Aucun client</p>
        <p className="mt-1 text-xs text-[#8A8780]">
          Créez votre première commande pour ajouter un client.
        </p>
      </div>
      <Link
        href="/dashboard/orders/new"
        className="rounded-[10px] bg-[#10B981] px-4 py-2.5 text-sm font-medium text-white"
      >
        + Nouvelle commande
      </Link>
    </div>
  );
}
