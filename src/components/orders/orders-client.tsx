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

// ── Neumorphic palette ────────────────────────────────────────
const BG           = "#1a1b1f";
const SHADOW_LIGHT = "#212227";
const SHADOW_DARK  = "#131417";
const EMERALD      = "#10B981";
const OFF_WHITE    = "#F5F0E8";
const MUTED        = "rgba(245,240,232,0.4)";

const cardNeumorphic = {
  background: BG,
  boxShadow: `-6px -6px 14px ${SHADOW_LIGHT}, 6px 6px 14px ${SHADOW_DARK}`,
};

const cardNeumorphicGlow = {
  background: BG,
  boxShadow: `-6px -6px 14px ${SHADOW_LIGHT}, 6px 6px 14px ${SHADOW_DARK}, 0 0 25px rgba(16,185,129,0.3)`,
};

const pillNeumorphic = {
  background: BG,
  boxShadow: `-3px -3px 8px ${SHADOW_LIGHT}, 3px 3px 8px ${SHADOW_DARK}`,
};

const pillNeumorphicActive = {
  background: BG,
  boxShadow: `inset 4px 4px 8px ${SHADOW_DARK}, inset -4px -4px 8px ${SHADOW_LIGHT}`,
};

// ── Status dots ───────────────────────────────────────────────
const MOBILE_STATUS: Record<OrderStatus, { label: string; dot: string }> = {
  pending:    { label: "En attente", dot: "#F59E0B" },
  confirmed:  { label: "Confirmée",  dot: "rgba(245,240,232,0.5)" },
  processing: { label: "En cours",   dot: "rgba(245,240,232,0.5)" },
  shipped:    { label: "En cours",   dot: "rgba(245,240,232,0.5)" },
  delivered:  { label: "Livrée",     dot: EMERALD },
  cancelled:  { label: "Annulée",    dot: "#F87171" },
  returned:   { label: "Retournée",  dot: "#8A8896" },
};

const FILTERS: { label: string; value: string }[] = [
  { label: "Toutes",     value: "" },
  { label: "En attente", value: "pending" },
  { label: "Confirmées", value: "confirmed" },
  { label: "En cours",   value: "shipped" },  // covers processing+shipped
  { label: "Livrées",    value: "delivered" },
  { label: "Annulées",   value: "cancelled" },
];

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
    <main
      className={`w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-4 ${selectMode && selected.size > 0 ? 'pb-64' : 'pb-44'} md:p-6 space-y-4`}
      style={{ background: BG }}
    >

      {/* Filtre pills + Sélectionner + Nouvelle commande */}
      {selectMode ? (
        <div className="flex items-center justify-between py-0.5">
          <p style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 700 }}>
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </p>
          <button
            onClick={exitSelectMode}
            className="text-sm font-medium rounded-[10px] px-3 py-1.5 transition-transform active:scale-[0.97]"
            style={{
              color: "rgba(245,240,232,0.65)",
              background: BG,
              boxShadow: `-3px -3px 7px ${SHADOW_LIGHT}, 3px 3px 7px ${SHADOW_DARK}`,
            }}
          >
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
                <span key={f.value || "all"} className="contents">
                  {/* Mobile pill — neumorphique */}
                  <button
                    onClick={() => setActiveFilter(f.value)}
                    className="md:hidden shrink-0 whitespace-nowrap rounded-[12px] px-4 py-2 text-sm font-medium transition-all"
                    style={active
                      ? { ...pillNeumorphicActive, color: EMERALD }
                      : { ...pillNeumorphic, color: "rgba(245,240,232,0.6)" }
                    }
                  >
                    {f.label}{count > 0 ? ` (${count})` : ""}
                  </button>

                  {/* Desktop pill — style original */}
                  <button
                    onClick={() => setActiveFilter(f.value)}
                    className={`hidden md:inline-flex shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#10B981] text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {f.label}{count > 0 ? ` (${count})` : ""}
                  </button>
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard/orders/new">
              <span
                className="inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold whitespace-nowrap transition-transform active:scale-[0.97]"
                style={{
                  background: EMERALD,
                  color: OFF_WHITE,
                  boxShadow: `inset 0 2px 0 0 rgba(255,255,255,0.4), inset 0 -2px 0 0 rgba(0,80,50,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.2), 0 4px 12px rgba(16,185,129,0.4), 0 1px 3px rgba(0,0,0,0.3)`,
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvelle commande</span>
                <span className="sm:hidden">Nouvelle</span>
              </span>
            </Link>
            <button
              onClick={() => setSelectMode(true)}
              className="md:hidden text-sm font-medium rounded-[10px] px-3 py-1.5 transition-transform active:scale-[0.97]"
              style={{
                color: "rgba(245,240,232,0.65)",
                background: BG,
                boxShadow: `-3px -3px 7px ${SHADOW_LIGHT}, 3px 3px 7px ${SHADOW_DARK}`,
              }}
            >
              Sélectionner
            </button>
          </div>
        </div>
      )}

      {/* Mobile — liste de cards */}
      <div className="w-full md:hidden space-y-3">
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
                className="w-full flex items-center gap-3 rounded-[18px] cursor-pointer transition-all active:scale-[0.99]"
                style={{
                  ...(isSelected ? cardNeumorphicGlow : cardNeumorphic),
                  padding: "14px 14px",
                }}
              >
                {selectMode ? (
                  <div
                    className="rounded-full flex items-center justify-center shrink-0"
                    style={{
                      width: 24, height: 24,
                      background: BG,
                      boxShadow: isSelected
                        ? `inset 1.5px 1.5px 3px ${SHADOW_DARK}, inset -1.5px -1.5px 3px ${SHADOW_LIGHT}, inset 0 0 10px rgba(16,185,129,0.5)`
                        : `inset 1.5px 1.5px 3px ${SHADOW_DARK}, inset -1.5px -1.5px 3px ${SHADOW_LIGHT}`,
                    }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" style={{ color: EMERALD }} strokeWidth={3} />}
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center rounded-[11px] shrink-0 font-bold"
                    style={{
                      width: 40, height: 40, fontSize: 14,
                      color: EMERALD,
                      background: BG,
                      boxShadow: `-2px -2px 5px ${SHADOW_LIGHT}, 2px 2px 5px ${SHADOW_DARK}`,
                    }}
                  >
                    {name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 500 }} className="truncate leading-tight">
                    {name}
                  </p>
                  <p style={{ fontSize: 11, color: MUTED }} className="font-mono mt-0.5">
                    {order.reference}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 600 }}>
                    {formatCurrency(order.total_amount)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        display: "inline-block", width: 6, height: 6,
                        borderRadius: "50%", background: ms.dot,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 11, color: "rgba(245,240,232,0.55)", fontWeight: 500 }}>
                      {ms.label}
                    </span>
                  </div>
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
        <div
          className="fixed bottom-24 left-4 right-4 z-40 flex items-center justify-between rounded-[16px] px-4 py-3 md:bottom-6 md:left-auto md:right-6"
          style={cardNeumorphic}
        >
          <p style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 500 }}>
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setBulkSheetOpen(true)}
            className="flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold transition-transform active:scale-[0.97]"
            style={{
              background: BG,
              color: "#F87171",
              boxShadow: `-2px -2px 6px ${SHADOW_LIGHT}, 2px 2px 6px ${SHADOW_DARK}, inset 0 0 8px rgba(248,113,113,0.15)`,
            }}
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
          <div
            className="relative w-full rounded-t-[24px] pb-[env(safe-area-inset-bottom,8px)]"
            style={{ background: BG }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="h-[3px] w-10 rounded-full"
                style={{ background: "rgba(245,240,232,0.2)" }}
              />
            </div>
            <div className="px-5 pb-6 pt-4 space-y-3">
              <p style={{ fontSize: 16, color: OFF_WHITE, fontWeight: 600 }}>
                Supprimer {selected.size} commande{selected.size > 1 ? "s" : ""} ?
              </p>
              <p style={{ fontSize: 13, color: MUTED }}>
                Cette action est irréversible.
              </p>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="mt-2 w-full rounded-[14px] px-4 py-3.5 text-sm font-semibold disabled:opacity-50 transition-transform active:scale-[0.98]"
                style={{
                  background: BG,
                  color: "#F87171",
                  boxShadow: `-3px -3px 8px ${SHADOW_LIGHT}, 3px 3px 8px ${SHADOW_DARK}, inset 0 0 12px rgba(248,113,113,0.2)`,
                }}
              >
                {bulkDeleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
              <button
                onClick={() => setBulkSheetOpen(false)}
                disabled={bulkDeleting}
                className="w-full rounded-[14px] px-4 py-3.5 text-sm font-semibold transition-transform active:scale-[0.98]"
                style={{
                  background: BG,
                  color: MUTED,
                  boxShadow: `-3px -3px 8px ${SHADOW_LIGHT}, 3px 3px 8px ${SHADOW_DARK}`,
                }}
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
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[14px]"
        style={{
          background: BG,
          boxShadow: `inset 2px 2px 4px ${SHADOW_DARK}, inset -2px -2px 4px ${SHADOW_LIGHT}`,
        }}
      >
        <ShoppingBag className="h-6 w-6" style={{ color: "rgba(245,240,232,0.5)" }} />
      </div>
      <div className="text-center">
        <p style={{ fontSize: 14, color: OFF_WHITE, fontWeight: 500 }}>Aucune commande</p>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          Créez votre première commande pour commencer.
        </p>
      </div>
      <Link
        href="/dashboard/orders/new"
        className="rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.97]"
        style={{
          background: EMERALD,
          color: OFF_WHITE,
          boxShadow: `inset 0 2px 0 0 rgba(255,255,255,0.4), inset 0 -2px 0 0 rgba(0,80,50,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.2), 0 4px 12px rgba(16,185,129,0.4), 0 1px 3px rgba(0,0,0,0.3)`,
        }}
      >
        + Nouvelle commande
      </Link>
    </div>
  );
}
