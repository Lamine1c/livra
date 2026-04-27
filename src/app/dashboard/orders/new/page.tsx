"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
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

// ── Palette ──────────────────────────────────────────────────
const BG           = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK  = "#0c0d11";
const EMERALD      = "#10B981";
const OFF_WHITE    = "#F5F0E8";
const MUTED        = "rgba(245,240,232,0.4)";

const sectionCard: CSSProperties = {
  background: BG,
  borderRadius: 18,
  boxShadow: `-12px -12px 20px ${SHADOW_LIGHT}, 12px 12px 20px ${SHADOW_DARK}`,
  padding: 18,
  marginBottom: 28,
};

const toggleActive: CSSProperties = {
  background: BG,
  color: EMERALD,
  padding: "6px 14px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  boxShadow: "inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03), inset 0 0 12px rgba(16,185,129,0.12)",
};

const toggleInactive: CSSProperties = {
  background: "transparent",
  color: MUTED,
  padding: "6px 14px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  border: "none",
};

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
    <div className="flex flex-1 flex-col min-h-0 md:bg-transparent" style={{ background: BG }}>
      <Header title="Nouvelle commande" backHref="/dashboard/orders" hideBell />
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-4 px-5 pb-52 md:p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 md:space-y-6">

          {/* Client */}
          <div style={sectionCard}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE }}>Client</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUseExistingClient(true)}
                  style={useExistingClient ? toggleActive : toggleInactive}
                >
                  Existant
                </button>
                <button
                  type="button"
                  onClick={() => setUseExistingClient(false)}
                  style={!useExistingClient ? toggleActive : toggleInactive}
                >
                  Nouveau
                </button>
              </div>
            </div>
            <div className="space-y-4">
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
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: EMERALD, background: "none", border: "none" }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier les infos du client
                        </button>
                      ) : (
                        <div
                          className="rounded-[14px] p-4 space-y-3"
                          style={{
                            background: BG,
                            boxShadow: "inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03), inset 0 0 14px rgba(16,185,129,0.1)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p style={{ fontSize: 13, fontWeight: 500, color: EMERALD }}>
                              Modifier le client
                            </p>
                            <button
                              type="button"
                              onClick={() => setEditingClient(false)}
                              style={{ color: EMERALD, background: "none", border: "none" }}
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
                          <p style={{ fontSize: 12, color: MUTED }}>
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
          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>
              Articles
            </h2>
            <div className="space-y-4">
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
                        className="mb-0.5 rounded-lg p-1.5 transition-colors"
                        style={{ color: "rgba(245,240,232,0.3)", background: "none", border: "none" }}
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
                      <p
                        className="text-[10px] uppercase tracking-wide mb-0.5"
                        style={{ color: MUTED }}
                      >
                        Total
                      </p>
                      <p style={{ color: OFF_WHITE, fontSize: 13, fontWeight: 600 }}>
                        {formatCurrency(line.quantity * line.unit_price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: EMERALD, background: "none", border: "none" }}
              >
                <Plus className="h-4 w-4" />
                Ajouter un article
              </button>
            </div>
          </div>

          {/* Résumé */}
          <div style={sectionCard}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: OFF_WHITE, marginBottom: 16 }}>
              Résumé
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span style={{ color: MUTED }}>Sous-total</span>
                <span style={{ color: OFF_WHITE, fontWeight: 500 }}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm" style={{ color: MUTED }}>
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
              <div
                className="flex justify-between pt-3 font-semibold"
                style={{ borderTop: "1px solid rgba(245,240,232,0.08)" }}
              >
                <span style={{ color: OFF_WHITE }}>Total</span>
                <span style={{ color: EMERALD }}>
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
            <p
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                color: "#F87171",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
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
