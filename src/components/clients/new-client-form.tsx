"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { WILAYAS } from "@/lib/utils";

// ── Palette A2-S1 ─────────────────────────────────────────────
const BG           = "#1a1b1f";
const SHADOW_LIGHT = "#1f2025";
const SHADOW_DARK  = "#0f1014";
const EMERALD      = "#10B981";
const OFF_WHITE    = "#F5F0E8";
const MUTED        = "rgba(245,240,232,0.4)";

const WILAYA_OPTIONS = Object.entries(WILAYAS).map(([code, name]) => ({
  value: code,
  label: `${code} - ${name}`,
}));

const inputStyle: CSSProperties = {
  background: BG,
  color: OFF_WHITE,
  borderRadius: 12,
  padding: "12px 16px",
  boxShadow: `inset -4px -4px 8px rgba(255,255,255,0.02), inset 4px 4px 8px rgba(0,0,0,0.42)`,
  border: "none",
  outline: "none",
  fontSize: 14,
  width: "100%",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: "block" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function NewClientForm() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    wilaya: "16",
    commune: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.wilaya || !form.commune || !form.address) {
      setError("Tous les champs sont requis.");
      return;
    }
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error: err } = await supabase.from("clients").insert({
      ...form,
      user_id: user.id,
    });

    if (err) {
      setError("Erreur lors de la création.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/clients");
  }

  return (
    <main
      className="w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pt-6 px-4 pb-52 md:p-6"
      style={{ background: BG }}
      onScroll={(e) => {
        window.dispatchEvent(
          new CustomEvent("livra:scroll", {
            detail: { scrollTop: e.currentTarget.scrollTop },
          })
        );
      }}
    >
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
        <Field label="Nom complet">
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="ex. Ahmed Benali"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Téléphone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="ex. 0561234567"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Wilaya">
          <select
            value={form.wilaya}
            onChange={(e) => setForm((p) => ({ ...p, wilaya: e.target.value }))}
            required
            className="appearance-none"
            style={inputStyle}
          >
            {WILAYA_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value} style={{ background: BG }}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Commune">
          <input
            type="text"
            value={form.commune}
            onChange={(e) => setForm((p) => ({ ...p, commune: e.target.value }))}
            placeholder="ex. Bab El Oued"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Adresse">
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="ex. Rue 23 Mars, Bâtiment A"
            required
            style={inputStyle}
          />
        </Field>

        {error && (
          <p style={{ fontSize: 13, color: "#F87171", paddingTop: 4 }}>{error}</p>
        )}

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[12px] py-3 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-50"
            style={{
              background: BG,
              color: EMERALD,
              boxShadow: `-8px -8px 16px ${SHADOW_LIGHT}, 8px 8px 16px ${SHADOW_DARK}`,
            }}
          >
            {loading ? "Création…" : "Enregistrer"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/clients")}
            className="w-full rounded-[12px] py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
            style={{
              background: BG,
              color: MUTED,
              boxShadow: `-8px -8px 16px ${SHADOW_LIGHT}, 8px 8px 16px ${SHADOW_DARK}`,
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </main>
  );
}
