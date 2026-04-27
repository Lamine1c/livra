"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { OrdersTable } from "@/components/orders/orders-table";

// ── Palette A2-S1 audacieux ───────────────────────────────────
const BG           = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK  = "#0c0d11";
const AVATAR_BG    = "#282a2f";
const AVATAR_DARK  = "#0a0b0f";
const EMERALD      = "#10B981";
const OFF_WHITE    = "#F5F0E8";
const MUTED        = "rgba(245,240,232,0.4)";

const cardNeumorphic = {
  background: BG,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
};

const avatarStyle = {
  background: BG,
  boxShadow: `inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03)`,
};

const pillNeumorphic = {
  background: BG,
  boxShadow: `-6px -6px 12px ${SHADOW_LIGHT}, 6px 6px 12px ${SHADOW_DARK}`,
};

const pillNeumorphicActive = {
  background: BG,
  boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.3), inset 5px 5px 10px rgba(0,0,0,0.4), inset 0 0 14px rgba(16,185,129,0.12)`,
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

  return (
    <main
      className="w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-4 pb-52 md:p-6 space-y-4"
      onScroll={(e) => {
        window.dispatchEvent(
          new CustomEvent("livra:scroll", {
            detail: { scrollTop: e.currentTarget.scrollTop },
          })
        );
      }}
      style={{ background: BG }}
    >

      {/* Filtre pills + Nouvelle commande */}
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
                  className="md:hidden shrink-0 whitespace-nowrap rounded-[20px] px-4 py-2 text-sm font-medium transition-all"
                  style={active
                    ? { ...pillNeumorphicActive, color: OFF_WHITE }
                    : { ...pillNeumorphic, color: MUTED }
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

        <div className="flex items-center shrink-0">
          <Link href="/dashboard/orders/new">
            <span
              className="inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold whitespace-nowrap transition-transform active:scale-[0.97]"
              style={{
                background: BG,
                color: EMERALD,
                boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle commande</span>
              <span className="sm:hidden">Nouvelle</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile — liste de cards */}
      <div className="w-full md:hidden space-y-5">
        {filtered.length === 0 ? (
          <EmptyOrders />
        ) : (
          filtered.map((order) => {
            const name = order.client?.full_name ?? "—";
            const ms = MOBILE_STATUS[order.status];
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="w-full flex items-center gap-3 rounded-[18px] transition-all active:scale-[0.99]"
                style={{
                  ...cardNeumorphic,
                  padding: "14px 14px",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-[10px] shrink-0 font-bold"
                  style={{
                    width: 40, height: 40, fontSize: 14,
                    color: OFF_WHITE,
                    ...avatarStyle,
                  }}
                >
                  {name[0]?.toUpperCase()}
                </div>
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
              </Link>
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
          boxShadow: `inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03)`,
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
          background: BG,
          color: EMERALD,
          boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
        }}
      >
        + Nouvelle commande
      </Link>
    </div>
  );
}
