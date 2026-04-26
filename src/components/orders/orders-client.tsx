"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag, Trash2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { OrdersTable } from "@/components/orders/orders-table";

const MOBILE_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: "En attente", cls: "bg-orange-500/15 text-orange-400" },
  confirmed:  { label: "Confirmée",  cls: "bg-blue-500/15 text-blue-400" },
  processing: { label: "En cours",   cls: "bg-blue-500/15 text-blue-400" },
  shipped:    { label: "En cours",   cls: "bg-blue-500/15 text-blue-400" },
  delivered:  { label: "Livrée",     cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled:  { label: "Annulée",    cls: "bg-red-500/15 text-red-400" },
  returned:   { label: "Retournée",  cls: "bg-[#252525] text-[#8A8780]" },
};

const FILTERS: { label: string; value: string }[] = [
  { label: "Toutes",     value: "" },
  { label: "En attente", value: "pending" },
  { label: "Confirmées", value: "confirmed" },
  { label: "En cours",   value: "shipped" },  // covers processing+shipped
  { label: "Livrées",    value: "delivered" },
  { label: "Annulées",   value: "cancelled" },
];

function avatarColor(name: string): string {
  const p = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-rose-500", "bg-amber-500"];
  return p[name.toUpperCase().charCodeAt(0) % p.length];
}

interface OrdersClientProps {
  orders: Order[];
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [activeFilter, setActiveFilter] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSheetOpen, setBulkSheetOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const filtered = useMemo(() => {
    if (!activeFilter) return orders;
    if (activeFilter === "shipped")
      return orders.filter((o) => o.status === "processing" || o.status === "shipped");
    return orders.filter((o) => o.status === activeFilter);
  }, [orders, activeFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { "": orders.length };
    for (const f of FILTERS) {
      if (!f.value) continue;
      if (f.value === "shipped") {
        c["shipped"] = orders.filter((o) => o.status === "processing" || o.status === "shipped").length;
      } else {
        c[f.value] = orders.filter((o) => o.status === f.value).length;
      }
    }
    return c;
  }, [orders]);

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
    const ids = Array.from(selected);
    for (const id of ids) {
      await supabase.from("order_items").delete().eq("order_id", id);
    }
    await supabase.from("orders").delete().in("id", ids);
    setBulkDeleting(false);
    setBulkSheetOpen(false);
    exitSelectMode();
    router.refresh();
  }

  return (
    <main className="w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-4 pb-40 md:p-6 space-y-4">

      {/* Filtre pills + Sélectionner + Nouvelle commande */}
      {selectMode ? (
        <div className="flex items-center justify-between py-0.5">
          <p className="text-sm font-medium text-[#F0EDE8]">
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </p>
          <button onClick={exitSelectMode} className="text-sm text-[#8A8780]">
            Annuler
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-webkit-scrollbar:hidden]">
            {FILTERS.map((f) => {
              const active = activeFilter === f.value;
              const count = counts[f.value] ?? 0;
              return (
                <button
                  key={f.value || "all"}
                  onClick={() => setActiveFilter(f.value)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#10B981] text-white"
                      : "bg-[#2A2A2E] text-[#A8A5A0] border border-[#333] md:bg-white md:text-gray-600 md:border-gray-200 hover:text-[#F0EDE8] md:hover:bg-gray-100"
                  }`}
                >
                  {f.label}{count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard/orders/new">
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvelle commande</span>
                <span className="sm:hidden">Nouvelle</span>
              </span>
            </Link>
            <button
              onClick={() => setSelectMode(true)}
              className="md:hidden text-sm text-[#8A8780] hover:text-[#F0EDE8]"
            >
              Sélectionner
            </button>
          </div>
        </div>
      )}

      {/* Mobile — liste de cards */}
      <div className="w-full md:hidden space-y-2">
        {filtered.length === 0 ? (
          <EmptyOrders />
        ) : (
          filtered.map((order) => {
            const name = order.client?.full_name ?? "—";
            const ms = MOBILE_STATUS[order.status];
            const isSelected = selected.has(order.id);
            return (
              <div
                key={order.id}
                onClick={() =>
                  selectMode
                    ? toggleSelect(order.id)
                    : router.push(`/dashboard/orders/${order.id}`)
                }
                className={`w-full flex items-center gap-3 rounded-xl border p-3.5 transition-colors cursor-pointer ${
                  isSelected
                    ? "border-emerald-500/50 bg-[#0A2A14]"
                    : "border-[#252525] bg-[#161618] active:opacity-70"
                }`}
              >
                {selectMode ? (
                  <div
                    className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-[#10B981] bg-[#0A2A14]"
                        : "border-[#333] bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-[#10B981]" />}
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(name)}`}
                  >
                    {name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#F0EDE8] font-medium text-sm leading-tight truncate">
                    {name}
                  </p>
                  <p className="text-[#8A8780] text-xs font-mono mt-0.5">
                    {order.reference}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="text-[#F0EDE8] text-sm font-semibold">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full leading-none ${ms.cls}`}
                  >
                    {ms.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop — tableau */}
      <div className="hidden md:block">
        {filtered.length === 0 ? (
          <EmptyOrders />
        ) : (
          <Card>
            <CardContent className="p-0">
              <OrdersTable orders={filtered} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Barre de sélection bulk */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-between border-t border-[#333] bg-[#1E1E20] px-4 py-3 md:bottom-0">
          <p className="text-sm text-[#F0EDE8]">
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
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
                Supprimer {selected.size} commande{selected.size > 1 ? "s" : ""} ?
              </p>
              <p className="text-sm text-[#8A8780]">Cette action est irréversible.</p>
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

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1E1E20]">
        <ShoppingBag className="h-6 w-6 text-[#8A8780]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#F0EDE8]">Aucune commande</p>
        <p className="mt-1 text-xs text-[#8A8780]">
          Créez votre première commande pour commencer.
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
