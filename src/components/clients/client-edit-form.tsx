"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { WILAYAS } from "@/lib/utils";
import { Client } from "@/types";
import { useToast, Toast } from "@/components/ui/toast";

const WILAYA_OPTIONS = Object.entries(WILAYAS).map(([code, name]) => ({
  value: code,
  label: `${code} - ${name}`,
}));

export function ClientEditForm({ client }: { client: Client }) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    full_name: client.full_name,
    phone: client.phone,
    wilaya: client.wilaya,
    commune: client.commune,
    address: client.address,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { message, showToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase
      .from("clients")
      .update(form)
      .eq("id", client.id);

    if (err) {
      setError("Erreur lors de la mise à jour.");
      setLoading(false);
      return;
    }

    showToast("Modifications enregistrées");
    setLoading(false);
    router.refresh();
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nom complet"
          value={form.full_name}
          onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
          required
        />
        <Input
          label="Téléphone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          required
        />
        <Select
          label="Wilaya"
          options={WILAYA_OPTIONS}
          value={form.wilaya}
          onChange={(e) => setForm((p) => ({ ...p, wilaya: e.target.value }))}
          required
        />
        <Input
          label="Commune"
          value={form.commune}
          onChange={(e) => setForm((p) => ({ ...p, commune: e.target.value }))}
          required
        />
        <div className="sm:col-span-2">
          <Input
            label="Adresse"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            required
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
    <Toast message={message} />
    </>
  );
}
