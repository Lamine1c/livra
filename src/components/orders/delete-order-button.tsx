"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    setLoading(true);
    await supabase.from("order_items").delete().eq("order_id", orderId);
    await supabase.from("orders").delete().eq("id", orderId);
    router.push("/dashboard/orders");
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Confirmer la suppression ?</span>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
          {loading ? "Suppression..." : "Supprimer"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(false)} disabled={loading}>
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
