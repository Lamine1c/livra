"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", shortLabel: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Commandes", shortLabel: "Commandes", icon: ShoppingCart },
  { href: "/dashboard/clients", label: "Clients", shortLabel: "Clients", icon: Users },
  { href: "/dashboard/settings", label: "Réglages", shortLabel: "Réglages", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const detail = (e as CustomEvent<{ scrollTop: number }>).detail;
      setScrolled(detail.scrollTop > 0);
    };

    setScrolled(false);

    window.addEventListener("livra:scroll", handleScroll);
    return () => window.removeEventListener("livra:scroll", handleScroll);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <Package className="h-6 w-6 text-emerald-600" />
          <span className="text-xl font-bold text-gray-900">LIVRA</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation bar ────────────────────────── */}
      <nav
        className="md:hidden fixed left-3 right-3 z-50 rounded-[24px]"
        style={{
          bottom: "max(env(safe-area-inset-bottom, 8px), 8px)",
          background: "#1a1b1f",
          boxShadow: "-12px -12px 20px #1e1f24, 12px 12px 20px #0c0d11",
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, shortLabel, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[56px]"
              >
                <div
                  className="flex items-center justify-center w-11 h-9 rounded-[10px] transition-colors"
                  style={
                    active
                      ? {
                          background: "#1a1b1f",
                          boxShadow:
                            "inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03), inset 0 0 12px rgba(16,185,129,0.15)",
                        }
                      : undefined
                  }
                >
                  <Icon
                    className="h-[18px] w-[18px] transition-colors"
                    style={{ color: active ? "#F5F0E8" : "#8A8780" }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    scrolled ? "opacity-0 max-h-0 overflow-hidden" : "opacity-100 max-h-4"
                  )}
                  style={{ color: active ? "#F5F0E8" : "#8A8780" }}
                >
                  {shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
