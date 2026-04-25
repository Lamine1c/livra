"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast, Toast } from "@/components/ui/toast";

interface OrderActionsMenuProps {
  orderId: string;
}

export function OrderActionsMenu({ orderId }: OrderActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { message, showToast } = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("order_items").delete().eq("order_id", orderId);
    await supabase.from("orders").delete().eq("id", orderId);
    showToast("Commande supprimée");
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/dashboard/orders");
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Actions"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8A8780] hover:bg-[#1e1e20] md:hover:bg-gray-100 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#333] bg-[#1E1E20] shadow-xl z-50 overflow-hidden">
            <Link
              href={`/dashboard/orders/${orderId}/edit`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0EDE8] hover:bg-[#252525] transition-colors"
            >
              <Pencil className="h-4 w-4 shrink-0" />
              Modifier la commande
            </Link>
            <button
              onClick={() => {
                console.log("TODO: Dupliquer commande", orderId);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#F0EDE8] hover:bg-[#252525] transition-colors"
            >
              <Copy className="h-4 w-4 shrink-0" />
              Dupliquer
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setDeleteSheetOpen(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#F87171] hover:bg-[#252525] transition-colors"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Delete bottom sheet */}
      {deleteSheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              if (!deleting) setDeleteSheetOpen(false);
            }}
          />
          <div className="relative w-full rounded-t-[16px] bg-[#1A1A1C] pb-safe">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-[3px] w-8 rounded-full bg-[#444]" />
            </div>
            <div className="px-5 pb-6 pt-4 space-y-3">
              <p className="font-semibold text-[#F0EDE8]">
                Supprimer cette commande ?
              </p>
              <p className="text-sm text-[#8A8780]">
                Cette action est irréversible.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="mt-2 w-full rounded-xl border border-[#F87171] bg-[#2D1010] px-4 py-3.5 text-sm font-semibold text-[#F87171] disabled:opacity-50 transition-opacity"
              >
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
              <button
                onClick={() => setDeleteSheetOpen(false)}
                disabled={deleting}
                className="w-full rounded-xl bg-[#252525] px-4 py-3.5 text-sm font-semibold text-[#8A8780]"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} />
    </>
  );
}
