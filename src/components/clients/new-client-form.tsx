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

const BASE_INPUT: CSSProperties = {
  background: BG,
  color: OFF_WHITE,
  borderRadius: 12,
  padding: "12px 16px",
  border: "none",
  outline: "none",
  fontSize: 14,
  width: "100%",
};

const SHADOW_NORMAL = `inset -4px -4px 8px rgba(255,255,255,0.02), inset 4px 4px 8px rgba(0,0,0,0.42)`;
const SHADOW_ERROR  = `inset -4px -4px 8px rgba(255,255,255,0.02), inset 4px 4px 8px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(248,113,113,0.4)`;

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
    wilaya: "",
    commune: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, boolean> = {};
    if (!form.full_name.trim()) newErrors.full_name = true;
    if (!form.phone.trim()) newErrors.phone = true;
    if (!form.wilaya) newErrors.wilaya = true;
    if (!form.commune.trim()) newErrors.commune = true;
    if (!form.address.trim()) newErrors.address = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
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
            onChange={(e) => {
              setForm((p) => ({ ...p, full_name: e.target.value }));
              if (errors.full_name) setErrors((p) => ({ ...p, full_name: false }));
            }}
            placeholder="ex. Ahmed Benali"
            style={{ ...BASE_INPUT, boxShadow: errors.full_name ? SHADOW_ERROR : SHADOW_NORMAL }}
          />
        </Field>

        <Field label="Téléphone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => {
              setForm((p) => ({ ...p, phone: e.target.value }));
              if (errors.phone) setErrors((p) => ({ ...p, phone: false }));
            }}
            placeholder="ex. 0561234567"
            style={{ ...BASE_INPUT, boxShadow: errors.phone ? SHADOW_ERROR : SHADOW_NORMAL }}
          />
        </Field>

        <Field label="Wilaya">
          <select
            value={form.wilaya}
            onChange={(e) => {
              setForm((p) => ({ ...p, wilaya: e.target.value }));
              if (errors.wilaya) setErrors((p) => ({ ...p, wilaya: false }));
            }}
            className="appearance-none"
            style={{ ...BASE_INPUT, boxShadow: errors.wilaya ? SHADOW_ERROR : SHADOW_NORMAL }}
          >
            <option value="" disabled style={{ background: BG }}>Choisir une wilaya</option>
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
            onChange={(e) => {
              setForm((p) => ({ ...p, commune: e.target.value }));
              if (errors.commune) setErrors((p) => ({ ...p, commune: false }));
            }}
            placeholder="ex. Bab El Oued"
            style={{ ...BASE_INPUT, boxShadow: errors.commune ? SHADOW_ERROR : SHADOW_NORMAL }}
          />
        </Field>

        <Field label="Adresse">
          <input
            type="text"
            value={form.address}
            onChange={(e) => {
              setForm((p) => ({ ...p, address: e.target.value }));
              if (errors.address) setErrors((p) => ({ ...p, address: false }));
            }}
            placeholder="ex. Rue 23 Mars, Bâtiment A"
            style={{ ...BASE_INPUT, boxShadow: errors.address ? SHADOW_ERROR : SHADOW_NORMAL }}
          />
        </Field>

        {error && (
          <p style={{ fontSize: 13, color: "#F87171", paddingTop: 4 }}>{error}</p>
        )}

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[12px] py-3 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
            style={{
              background: BG,
              color: loading ? "rgba(16,185,129,0.5)" : EMERALD,
              boxShadow: `-8px -8px 16px ${SHADOW_LIGHT}, 8px 8px 16px ${SHADOW_DARK}`,
            }}
          >
            {loading && (
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mr-2" />
            )}
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/clients")}
            className="w-full rounded-[12px] py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
            style={{
              background: BG,
              color: "rgba(245,240,232,0.5)",
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
