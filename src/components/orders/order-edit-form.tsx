"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderItem } from "@/types";

interface OrderLine {
  product_name: string;
  quantity: number;
  unit_price: number;
}

function toLines(items: OrderItem[]): OrderLine[] {
  return items.map((i) => ({
    product_name: i.product_name,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));
}

export function OrderEditForm({ order }: { order: Order }) {
  const router = useRouter();
  const supabase = createClient();

  const [lines, setLines] = useState<OrderLine[]>(
    order.items?.length
      ? toLines(order.items)
      : [{ product_name: "", quantity: 1, unit_price: 0 }]
  );
  const [deliveryFee, setDeliveryFee] = useState(order.delivery_fee);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
  const total = subtotal + deliveryFee;

  function addLine() {
    setLines((prev) => [...prev, { product_name: "", quantity: 1, unit_price: 0 }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof OrderLine, value: string | number) {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: delErr } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", order.id);

    if (delErr) {
      setError("Erreur lors de la mise à jour.");
      setLoading(false);
      return;
    }

    const items = lines.map((l) => ({
      order_id: order.id,
      product_name: l.product_name,
      quantity: l.quantity,
      unit_price: l.unit_price,
      total_price: l.quantity * l.unit_price,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) {
      setError("Erreur lors de l'enregistrement des articles.");
      setLoading(false);
      return;
    }

    const { error: orderErr } = await supabase
      .from("orders")
      .update({ total_amount: total, delivery_fee: deliveryFee, notes: notes || null })
      .eq("id", order.id);

    if (orderErr) {
      setError("Erreur lors de la mise à jour de la commande.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/orders/${order.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Articles</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label={i === 0 ? "Produit" : undefined}
                  placeholder="Nom du produit"
                  value={line.product_name}
                  onChange={(e) => updateLine(i, "product_name", e.target.value)}
                  required
                />
              </div>
              <div className="w-20">
                <Input
                  label={i === 0 ? "Qté" : undefined}
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(i, "quantity", parseInt(e.target.value) || 1)
                  }
                  required
                />
              </div>
              <div className="w-32">
                <Input
                  label={i === 0 ? "Prix unitaire" : undefined}
                  type="number"
                  min={0}
                  step={100}
                  value={line.unit_price}
                  onChange={(e) =>
                    updateLine(i, "unit_price", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="w-28 pb-0.5">
                <p className="text-sm font-medium text-gray-700">
                  {formatCurrency(line.quantity * line.unit_price)}
                </p>
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="mb-0.5 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter un article
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Résumé</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500">Frais de livraison</span>
            <div className="w-36">
              <Input
                type="number"
                min={0}
                step={100}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 font-semibold">
            <span>Total</span>
            <span className="text-emerald-600">{formatCurrency(total)}</span>
          </div>
          <Input
            label="Notes (optionnel)"
            placeholder="Instructions spéciales..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
