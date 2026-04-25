"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import { useToast, Toast } from "@/components/ui/toast";

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

const DC = "rounded-xl border border-[#252525] bg-[#161618] md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden";
const DCH = "px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100";
const DCB = "px-4 py-4 md:px-6";

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
  const { message, showToast } = useToast();

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

    showToast("Modifications enregistrées");
    await new Promise((r) => setTimeout(r, 1200));
    router.push(`/dashboard/orders/${order.id}`);
    router.refresh();
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

      {/* Articles */}
      <div className={DC}>
        <div className={DCH}>
          <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">Articles</h2>
        </div>
        <div className={`${DCB} space-y-4`}>
          {lines.map((line, i) => (
            <div key={i} className="space-y-2">
              {/* Ligne 1 : produit full-width + bouton suppression */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="Produit"
                    placeholder="Nom du produit"
                    value={line.product_name}
                    onChange={(e) => updateLine(i, "product_name", e.target.value)}
                    required
                  />
                </div>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="mb-0.5 rounded-lg p-1.5 text-[#8A8780] hover:bg-[#252525] hover:text-red-400 md:text-gray-400 md:hover:bg-red-50 md:hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Ligne 2 : qté (1/3) + prix (2/3) + total affiché */}
              <div className="flex gap-2 items-end">
                <div className="w-1/3">
                  <Input
                    label="Qté"
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(i, "quantity", parseInt(e.target.value) || 1)
                    }
                    required
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="Prix unitaire"
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
                <div className="shrink-0 pb-0.5 text-right min-w-[76px]">
                  <p className="text-[10px] uppercase tracking-wide text-[#8A8780] md:text-gray-400 mb-0.5">
                    Total
                  </p>
                  <p className="text-sm font-semibold text-[#F0EDE8] md:text-gray-900">
                    {formatCurrency(line.quantity * line.unit_price)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-400 md:text-emerald-600 md:hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter un article
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className={DC}>
        <div className={DCH}>
          <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">Résumé</h2>
        </div>
        <div className={`${DCB} space-y-4`}>
          <div className="flex justify-between text-sm">
            <span className="text-[#8A8780] md:text-gray-500">Sous-total</span>
            <span className="font-medium text-[#F0EDE8] md:text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#8A8780] md:text-gray-500">Frais de livraison</span>
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
          <div className="flex justify-between border-t border-[#252525] md:border-gray-100 pt-3 font-semibold">
            <span className="text-[#F0EDE8] md:text-gray-900">Total</span>
            <span className="text-emerald-400 md:text-emerald-600">{formatCurrency(total)}</span>
          </div>
          <Input
            label="Notes (optionnel)"
            placeholder="Instructions spéciales..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/30 bg-red-900/20 px-4 py-3 text-sm text-red-400 md:border-0 md:bg-red-50 md:text-red-600">
          {error}
        </p>
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
    <Toast message={message} />
    </>
  );
}
