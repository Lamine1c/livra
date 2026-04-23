"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { WILAYAS, formatCurrency, generateReference } from "@/lib/utils";
import { Client } from "@/types";

interface OrderLine {
  product_name: string;
  quantity: number;
  unit_price: number;
}

const WILAYA_OPTIONS = Object.entries(WILAYAS).map(([code, name]) => ({
  value: code,
  label: `${code} - ${name}`,
}));

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState({
    full_name: "",
    phone: "",
    wilaya: "",
    commune: "",
    address: "",
  });
  const [useExistingClient, setUseExistingClient] = useState(true);
  const [lines, setLines] = useState<OrderLine[]>([
    { product_name: "", quantity: 1, unit_price: 0 },
  ]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("clients")
      .select("*")
      .order("full_name")
      .then(({ data }) => setClients(data ?? []));
  }, []);

  const subtotal = lines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0
  );
  const total = subtotal + deliveryFee;

  function addLine() {
    setLines((prev) => [...prev, { product_name: "", quantity: 1, unit_price: 0 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof OrderLine, value: string | number) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let finalClientId = clientId;

    if (!useExistingClient) {
      const { data: created, error: clientError } = await supabase
        .from("clients")
        .insert({ ...newClient, user_id: user.id })
        .select()
        .single();

      if (clientError) {
        setError("Erreur lors de la création du client.");
        setLoading(false);
        return;
      }
      finalClientId = created.id;
    }

    const reference = generateReference();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        client_id: finalClientId,
        reference,
        status: "pending",
        total_amount: total,
        delivery_fee: deliveryFee,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError) {
      setError("Erreur lors de la création de la commande.");
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

    await supabase.from("order_items").insert(items);
    router.push(`/dashboard/orders/${order.id}`);
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Nouvelle commande" />
      <main className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Client</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUseExistingClient(true)}
                    className={`text-sm font-medium px-3 py-1 rounded-lg ${useExistingClient ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Existant
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseExistingClient(false)}
                    className={`text-sm font-medium px-3 py-1 rounded-lg ${!useExistingClient ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Nouveau
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {useExistingClient ? (
                <Select
                  label="Choisir un client"
                  options={clients.map((c) => ({
                    value: c.id,
                    label: `${c.full_name} — ${c.phone}`,
                  }))}
                  placeholder="Sélectionner un client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nom complet"
                    value={newClient.full_name}
                    onChange={(e) =>
                      setNewClient((p) => ({ ...p, full_name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Téléphone"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient((p) => ({ ...p, phone: e.target.value }))
                    }
                    required
                  />
                  <Select
                    label="Wilaya"
                    options={WILAYA_OPTIONS}
                    placeholder="Choisir une wilaya"
                    value={newClient.wilaya}
                    onChange={(e) =>
                      setNewClient((p) => ({ ...p, wilaya: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Commune"
                    value={newClient.commune}
                    onChange={(e) =>
                      setNewClient((p) => ({ ...p, commune: e.target.value }))
                    }
                    required
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Adresse"
                      value={newClient.address}
                      onChange={(e) =>
                        setNewClient((p) => ({ ...p, address: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                      onChange={(e) =>
                        updateLine(i, "product_name", e.target.value)
                      }
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
                    onChange={(e) =>
                      setDeliveryFee(parseFloat(e.target.value) || 0)
                    }
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
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer la commande"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
