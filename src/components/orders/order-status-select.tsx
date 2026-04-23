"use client";

import { useState } from "react";
import { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleChange(next: OrderStatus) {
    if (next === status) return;
    setLoading(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (!error) setStatus(next);
    setLoading(false);
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
