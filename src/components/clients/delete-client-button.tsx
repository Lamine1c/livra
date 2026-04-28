"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast, Toast } from "@/components/ui/toast";

type SheetState = "closed" | "loading" | "has-orders" | "confirm" | "deleting";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const [sheet, setSheet] = useState<SheetState>("closed");
  const router = useRouter();
  const supabase = createClient();
  const { message, showToast } = useToast();

  async function openSheet() {
    setSheet("loading");
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId);
    setSheet(count && count > 0 ? "has-orders" : "confirm");
  }

  async function handleDelete() {
    setSheet("deleting");
    await supabase.from("clients").delete().eq("id", clientId);
    showToast("Client supprimé");
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/dashboard/clients");
  }

  return (
    <>
      <button
        onClick={openSheet}
        className="flex items-center gap-1.5 rounded-[12px] px-3 py-1.5 text-sm font-medium transition-transform active:scale-[0.97]" style={{ background: "#1a1b1f", color: "#F87171", boxShadow: "-12px -12px 20px #1e1f24, 12px 12px 20px #0c0d11" }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Supprimer
      </button>

      {sheet !== "closed" && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              if (sheet !== "deleting" && sheet !== "loading") setSheet("closed");
            }}
          />
          <div className="relative w-full rounded-t-[16px] bg-[#1A1A1C] pb-safe">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-[3px] w-8 rounded-full bg-[#444]" />
            </div>

            {sheet === "loading" && (
              <div className="flex justify-center px-5 pb-8 pt-5">
                <div className="h-5 w-5 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
              </div>
            )}

            {sheet === "has-orders" && (
              <div className="px-5 pb-6 pt-4 space-y-3">
                <p className="font-semibold text-[#F0EDE8]">
                  Ce client a des commandes associées
                </p>
                <p className="text-sm text-[#8A8780]">
                  Supprimez d'abord ses commandes pour pouvoir le supprimer.
                </p>
                <button
                  onClick={() => setSheet("closed")}
                  className="mt-2 w-full rounded-xl bg-[#252525] px-4 py-3.5 text-sm font-semibold text-[#8A8780]"
                >
                  Compris — revenir
                </button>
              </div>
            )}

            {(sheet === "confirm" || sheet === "deleting") && (
              <div className="px-5 pb-6 pt-4 space-y-3">
                <p className="font-semibold text-[#F0EDE8]">
                  Supprimer ce client ?
                </p>
                <p className="text-sm text-[#8A8780]">
                  Cette action est irréversible.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={sheet === "deleting"}
                  className="mt-2 w-full rounded-xl border border-[#F87171] bg-[#2D1010] px-4 py-3.5 text-sm font-semibold text-[#F87171] disabled:opacity-50 transition-opacity"
                >
                  {sheet === "deleting" ? "Suppression…" : "Supprimer définitivement"}
                </button>
                <button
                  onClick={() => setSheet("closed")}
                  disabled={sheet === "deleting"}
                  className="w-full rounded-xl bg-[#252525] px-4 py-3.5 text-sm font-semibold text-[#8A8780]"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Toast message={message} />
    </>
  );
}
