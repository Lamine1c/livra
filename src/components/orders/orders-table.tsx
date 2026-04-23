"use client";

import Link from "next/link";
import { Order } from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p className="text-sm">Aucune commande trouvée.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Référence</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Wilaya</th>
            <th className="px-4 py-3">Montant</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="bg-white transition-colors hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-mono font-medium text-gray-900">
                {order.reference}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {order.client?.full_name ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {order.client?.commune}, W.{order.client?.wilaya}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {formatCurrency(order.total_amount)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-gray-500">
                {formatDate(order.created_at)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="inline-flex items-center gap-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
