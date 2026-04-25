"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

const DC = "rounded-xl border border-[#252525] bg-[#161618] md:border-gray-200 md:bg-white md:shadow-sm overflow-hidden";
const DCH = "px-4 py-3 md:px-6 md:py-4 border-b border-[#252525] md:border-gray-100";
const DCB = "px-4 py-4 md:px-6";

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
  const [editingClient, setEditingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState({
    full_name: "", phone: "", wilaya: "", commune: "", address: "",
  });
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

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
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

    if (useExistingClient && editingClient && clientId) {
      const { error: updateErr } = await supabase
        .from("clients")
        .update(editClientForm)
        .eq("id", clientId);
      if (updateErr) {
        setError("Erreur lors de la mise à jour du client.");
        setLoading(false);
        return;
      }
    }

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
    await fetch(`/api/orders/${order.id}/send-otp`, { method: "POST" });
    router.push(`/dashboard/orders/${order.id}`);
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[#0D0D0D] md:bg-transparent">
      <Header title="Nouvelle commande" />
      <main className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-4 pb-40 md:p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-4 md:space-y-6">

          {/* Client */}
          <div className={DC}>
            <div className={DCH}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#F0EDE8] md:text-gray-900">Client</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUseExistingClient(true)}
                    className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                      useExistingClient
                        ? "bg-[#10B981]/15 text-[#10B981] md:bg-emerald-100 md:text-emerald-700"
                        : "text-[#8A8780] hover:text-[#F0EDE8] md:text-gray-500 md:hover:text-gray-700"
                    }`}
                  >
                    Existant
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseExistingClient(false)}
                    className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                      !useExistingClient
                        ? "bg-[#10B981]/15 text-[#10B981] md:bg-emerald-100 md:text-emerald-700"
                        : "text-[#8A8780] hover:text-[#F0EDE8] md:text-gray-500 md:hover:text-gray-700"
                    }`}
                  >
                    Nouveau
                  </button>
                </div>
              </div>
            </div>
            <div className={`${DCB} space-y-4`}>
              {useExistingClient ? (
                <>
                  <Select
                    label="Choisir un client"
                    options={clients.map((c) => ({
                      value: c.id,
                      label: `${c.full_name} — ${c.phone}`,
                    }))}
                    placeholder="Sélectionner un client"
                    value={clientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setClientId(id);
                      setEditingClient(false);
                      const found = clients.find((c) => c.id === id);
                      if (found) {
                        setEditClientForm({
                          full_name: found.full_name,
                          phone: found.phone,
                          wilaya: found.wilaya,
                          commune: found.commune,
                          address: found.address,
                        });
                      }
                    }}
                    required
                  />
                  {clientId && (
                    <div>
                      {!editingClient ? (
                        <button
                          type="button"
                          onClick={() => setEditingClient(true)}
                          className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 md:text-emerald-600 md:hover:text-emerald-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier les infos du client
                        </button>
                      ) : (
                        <div className="rounded-lg border border-[#10B981]/30 bg-[#0A2A14] p-4 space-y-3 md:border-emerald-200 md:bg-emerald-50">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[#10B981] md:text-emerald-800">
                              Modifier le client
                            </p>
                            <button
                              type="button"
                              onClick={() => setEditingClient(false)}
                              className="text-[#10B981] hover:text-emerald-300 md:hover:text-emerald-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                              label="Nom complet"
                              value={editClientForm.full_name}
                              onChange={(e) =>
                                setEditClientForm((p) => ({ ...p, full_name: e.target.value }))
                              }
                            />
                            <Input
                              label="Téléphone"
                              value={editClientForm.phone}
                              onChange={(e) =>
                                setEditClientForm((p) => ({ ...p, phone: e.target.value }))
                              }
                            />
                            <Select
                              label="Wilaya"
                              options={WILAYA_OPTIONS}
                              value={editClientForm.wilaya}
                              onChange={(e) =>
                                setEditClientForm((p) => ({ ...p, wilaya: e.target.value }))
                              }
                            />
                            <Input
                              label="Commune"
                              value={editClientForm.commune}
                              onChange={(e) =>
                                setEditClientForm((p) => ({ ...p, commune: e.target.value }))
                              }
                            />
                            <div className="sm:col-span-2">
                              <Input
                                label="Adresse"
                                value={editClientForm.address}
                                onChange={(e) =>
                                  setEditClientForm((p) => ({ ...p, address: e.target.value }))
                                }
                              />
                            </div>
                          </div>
                          <p className="text-xs text-[#8A8780] md:text-emerald-700">
                            Ces modifications seront enregistrées à la création de la commande.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
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
            </div>
          </div>

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
                  {/* Ligne 2 : qté (1/3) + prix (flex-1) + total affiché */}
                  <div className="flex gap-2 items-end">
                    <div className="w-1/3">
                      <Input
                        label="Qté"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={line.quantity === 0 ? "" : String(line.quantity)}
                        onChange={(e) =>
                          updateLine(i, "quantity", parseInt(e.target.value) || 0)
                        }
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Prix unitaire"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={line.unit_price === 0 ? "" : String(line.unit_price)}
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
                <span className="text-sm text-[#8A8780] md:text-gray-500">
                  Frais de livraison
                </span>
                <div className="w-36">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={deliveryFee === 0 ? "" : String(deliveryFee)}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex justify-between border-t border-[#252525] md:border-gray-100 pt-3 font-semibold">
                <span className="text-[#F0EDE8] md:text-gray-900">Total</span>
                <span className="text-emerald-400 md:text-emerald-600">
                  {formatCurrency(total)}
                </span>
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
              {loading ? "Création..." : "Créer la commande"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
