"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LivraLogoHorizontal from "@/components/brand/LivraLogoHorizontal";

function NavLink({
  href,
  children,
  className,
  style,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isActive) {
    return (
      <span
        className={className}
        style={{ ...style, opacity: 0.3, cursor: "default", pointerEvents: "none" }}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        background: "var(--onyx)",
        borderBottom: "var(--border-faint)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="LIVRA — Accueil">
          <LivraLogoHorizontal height={22} />
        </Link>

        <nav className="hidden sm:flex items-center gap-8" aria-label="Navigation principale">
          <NavLink
            href="/pricing"
            className="text-mist hover:text-ivoire transition-colors duration-200 text-sm font-medium"
          >
            Tarifs
          </NavLink>
          <NavLink
            href="/telecharger"
            className="text-mist hover:text-ivoire transition-colors duration-200 text-sm font-medium"
          >
            Télécharger
          </NavLink>
          <NavLink
            href="/telecharger"
            className="text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-200"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#F5F0E8" }}
          >
            Se connecter
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
