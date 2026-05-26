import Link from "next/link";

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
        <Link
          href="/"
          className="text-ivoire font-medium tracking-widest text-sm"
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          aria-label="LIVRA — Accueil"
        >
          LIVRA
        </Link>

        <nav className="hidden sm:flex items-center gap-8" aria-label="Navigation principale">
          <Link
            href="/blog"
            className="text-mist hover:text-ivoire transition-colors duration-200 text-sm font-medium"
          >
            Blog
          </Link>
          <a
            href="mailto:hello@golivra.app"
            className="text-mist hover:text-ivoire transition-colors duration-200 text-sm font-medium"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
