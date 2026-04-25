"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    setLoading(true);

    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (count && count > 0) {
      setError(
        `Ce client a ${count} commande${count > 1 ? "s" : ""} associée${count > 1 ? "s" : ""}. Supprimez-les d'abord.`
      );
      setLoading(false);
      setConfirm(false);
      return;
    }

    await supabase.from("clients").delete().eq("id", clientId);
    router.push("/dashboard/clients");
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => setError("")}>
          OK
        </Button>
      </div>
    );
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[#8A8780] md:text-gray-600">
          Confirmer la suppression ?
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Suppression..." : "Supprimer"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirm(false)}
          disabled={loading}
        >
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirm(true)}>
      <Trash2 className="h-4 w-4" />
      Supprimer
    </Button>
  );
}
