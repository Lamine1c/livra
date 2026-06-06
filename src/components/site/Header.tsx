import Link from "next/link";
import LivraLogoHorizontal from "@/components/brand/LivraLogoHorizontal";

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
          <Link
            href="/pricing"
            className="text-mist hover:text-ivoire transition-colors duration-200 text-sm font-medium"
          >
            Tarifs
          </Link>
          <Link
            href="/telecharger"
            className="text-mist hover:text-ivoire transition-colors duration-200 text-sm font-medium"
          >
            Télécharger
          </Link>
          <Link
            href="/telecharger"
            className="text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-200"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#F5F0E8" }}
          >
            Se connecter
          </Link>
        </nav>
      </div>
    </header>
  );
}
