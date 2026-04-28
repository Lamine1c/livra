"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const CARRIERS = ["Yalidine", "ZR Express", "Ecotrack", "Autre"] as const;
type Carrier = (typeof CARRIERS)[number];

const CARRIER_TRACKING_URLS: Partial<Record<Carrier, (tracking: string) => string>> = {
  Yalidine:    (t) => `https://www.yalidine.app/?tracking=${t}`,
  "ZR Express": (t) => `https://www.zrexpress.dz/tracking/${t}`,
  Ecotrack:    (t) => `https://ecotrack.dz/tracking/${t}`,
};

const CARRIER_OPTIONS = CARRIERS.map((c) => ({ value: c, label: c }));

interface ManualTrackingFormProps {
  orderId: string;
  initialTracking: string | null;
  initialCarrier: string | null;
}

export function ManualTrackingForm({
  orderId,
  initialTracking,
  initialCarrier,
}: ManualTrackingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [carrier, setCarrier] = useState<string>(initialCarrier ?? "Yalidine");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(!!initialTracking);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tracking.trim()) return;
    setLoading(true);
    setError("");

    const { error: dbError } = await supabase
      .from("orders")
      .update({
        tracking_number: tracking.trim(),
        carrier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (dbError) {
      setError("Erreur lors de la sauvegarde.");
    } else {
      setSaved(true);
      router.refresh();
    }
    setLoading(false);
  }

  const trackingUrl =
    saved && tracking && carrier in CARRIER_TRACKING_URLS
      ? CARRIER_TRACKING_URLS[carrier as Carrier]!(tracking)
      : null;

  return (
    <div className="space-y-4">
      {/* Affichage du tracking enregistré */}
      {saved && tracking && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-900">{carrier}</p>
              <p className="font-mono text-sm text-emerald-700">{tracking}</p>
            </div>
          </div>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
            >
              Suivre
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Numéro de tracking"
            placeholder="Ex : YAL-2024-XXXXX"
            value={tracking}
            onChange={(e) => { setTracking(e.target.value); setSaved(false); }}
          />
          <Select
            label="Transporteur"
            options={CARRIER_OPTIONS}
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="primary" disabled={loading || !tracking.trim()}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            "Enregistrer le tracking"
          )}
        </Button>
      </form>
    </div>
  );
}
