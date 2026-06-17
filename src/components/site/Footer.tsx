import Link from "next/link";
import LivraLogoHorizontal from "@/components/brand/LivraLogoHorizontal";

export default function Footer() {
  return (
    <footer
      className="bg-deep mt-auto"
      style={{ borderTop: "var(--border-faint)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          {/* Brand */}
          <div>
            <LivraLogoHorizontal height={24} className="mb-3" />
            <p className="text-mist text-sm">
              L&apos;OS de votre e-commerce.
            </p>
          </div>

          {/* Links */}
          <nav
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-mist"
            aria-label="Liens du pied de page"
          >
            <Link href="/magazine" className="hover:text-ivoire transition-colors duration-200">
              Magazine
            </Link>
            <Link href="/privacy" className="hover:text-ivoire transition-colors duration-200">
              Privacy
            </Link>
            <Link href="/cgu" className="hover:text-ivoire transition-colors duration-200">
              CGU
            </Link>
            <a
              href="mailto:hello@golivra.app"
              className="hover:text-ivoire transition-colors duration-200"
            >
              Contact
            </a>
          </nav>
        </div>

        <div
          className="mt-10 pt-8"
          style={{ borderTop: "var(--border-faint)" }}
        >
          <p className="text-mist text-xs">
            &copy; 2026 LIVRA. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
