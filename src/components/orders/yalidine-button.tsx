"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { YALIDINE_TRACKING_URL } from "@/lib/yalidine";

interface YalidineButtonProps {
  orderId: string;
  trackingNumber: string | null;
}

export function YalidineButton({ orderId, trackingNumber: initialTracking }: YalidineButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(initialTracking);

  async function handleCreate() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}/yalidine`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de la création du bon.");
      setLoading(false);
      return;
    }

    setTracking(data.tracking);
    setLoading(false);
    router.refresh();
  }

  if (tracking) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">Bon créé avec succès</p>
            <p className="font-mono text-sm text-gray-600">{tracking}</p>
          </div>
        </div>
        <a
          href={`${YALIDINE_TRACKING_URL}?tracking=${tracking}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Suivre le colis
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleCreate} disabled={loading} variant="secondary">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Création en cours…
          </>
        ) : (
          <>
            <Truck className="h-4 w-4" />
            Créer bon Yalidine
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
