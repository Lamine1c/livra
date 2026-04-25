"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

interface OrderStatusRowProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusRow({ orderId, currentStatus }: OrderStatusRowProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleStatusChange(next: OrderStatus) {
    if (next === status) {
      setSheetOpen(false);
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (!error) setStatus(next);
    setLoading(false);
    setSheetOpen(false);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <StatusBadge status={status} />
        <button
          onClick={() => setSheetOpen(true)}
          disabled={loading}
          className="rounded-lg border border-[#10B981] bg-[#1A2A1A] px-3 py-1.5 text-sm font-medium text-[#10B981] disabled:opacity-50 transition-opacity"
        >
          Changer statut
        </button>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative w-full rounded-t-[16px] bg-[#1A1A1C] pb-safe">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-[3px] w-8 rounded-full bg-[#444]" />
            </div>
            <div className="px-5 pb-6 pt-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#8A8780] mb-3">
                Changer le statut
              </p>
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    s === status
                      ? "bg-[#1A2A1A] text-[#10B981] border border-[#10B981]/40"
                      : "bg-[#252525] text-[#F0EDE8] hover:bg-[#2e2e30]"
                  }`}
                >
                  {ORDER_STATUS_LABELS[s]}
                  {s === status && (
                    <span className="text-[10px] text-[#10B981]">actuel</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
