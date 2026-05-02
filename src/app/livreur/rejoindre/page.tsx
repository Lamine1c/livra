"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BG = "#1a1b1f";
const SHADOW_LIGHT = "#1e1f24";
const SHADOW_DARK = "#0c0d11";
const OFF_WHITE = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.4)";
const EMERALD = "#10B981";

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira",
  "Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda",
  "Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla",
  "Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
  "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar",
  "Ouled Djellal","Beni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa"
];

const COULEURS = ["🔴 Rouge","🟠 Orange","🟡 Jaune","🟢 Vert","🔵 Bleu","🟣 Violet","⚫ Noir","⚪ Blanc","🟤 Marron"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: BG,
  border: "none",
  borderRadius: 12,
  padding: "14px 16px",
  color: OFF_WHITE,
  fontSize: 15,
  marginBottom: 12,
  boxShadow: `inset -3px -3px 6px ${SHADOW_LIGHT}, inset 3px 3px 6px ${SHADOW_DARK}`,
  outline: "none",
  WebkitAppearance: "none",
  appearance: "none",
};

function SelectField({ value, onChange, placeholder, options }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{ ...inputStyle, marginBottom: 0, color: value ? OFF_WHITE : MUTED, width: "100%" }}
      >
        <option value="" disabled style={{ background: "#25262b", color: MUTED }}>{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o} style={{ background: "#25262b", color: OFF_WHITE }}>{o}</option>
        ))}
      </select>
      <div style={{
        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: MUTED, fontSize: 10,
      }}>▼</div>
    </div>
  );
}

function Form() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order");

  const [prenom, setPrenom] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [couleur, setCouleur] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: dbError } = await supabase
        .from("drivers")
        .insert({ prenom, whatsapp, wilaya, couleur_casque: couleur, order_id: orderId || null })
        .select()
        .single();

      if (dbError) throw dbError;

      if (orderId) {
        await supabase
          .from("orders")
          .update({ independent_driver_name: prenom, independent_driver_phone: whatsapp, status: "shipped" })
          .eq("id", orderId);

        await fetch(`/api/orders/${orderId}/driver-notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverName: prenom }),
        });
      }

      router.push(`/livreur/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: OFF_WHITE, marginBottom: 8 }}>Rejoindre LIVRA</h1>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>Inscrivez-vous en 30 secondes et offrez une expérience VIP à vos clients.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Votre prénom" value={prenom} onChange={e => setPrenom(e.target.value)} required style={inputStyle} />
          <input type="tel" placeholder="Numéro WhatsApp (ex: 0555123456)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required style={inputStyle} />
          <SelectField value={wilaya} onChange={setWilaya} placeholder="Votre wilaya" options={WILAYAS} />
          <SelectField value={couleur} onChange={setCouleur} placeholder="Couleur de votre casque" options={COULEURS} />

          {error && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 12, marginTop: 4 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: BG,
              color: loading ? MUTED : EMERALD,
              border: `1px solid rgba(16,185,129,0.3)`,
              borderRadius: 14,
              padding: "15px 18px",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.3,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
              boxShadow: `-4px -4px 8px ${SHADOW_LIGHT}, 4px 4px 8px ${SHADOW_DARK}`,
            }}
          >
            {loading ? "Inscription..." : "Je rejoins LIVRA 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><Form /></Suspense>;
}
