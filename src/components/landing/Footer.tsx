import Link from "next/link";

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-top">
          <div className="lp-footer-brand-block">
            <span className="lp-footer-brand">LIVRA</span>
            <p className="lp-footer-tagline">La transaction protégée des deux côtés.</p>
          </div>
        </div>
        <div className="lp-footer-divider"></div>
        <div className="lp-footer-bottom">
          <nav className="lp-footer-nav">
            <a href="#produit">Produit</a>
            <Link href="/pricing">Tarifs</Link>
            <Link href="/magazine">Magazine</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/privacy">Confidentialité</Link>
            <Link href="/cgu">CGU</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p className="lp-footer-copy">
            © 2026 LIVRA · Plateforme LIVRA (9516-1998 Québec inc.)
          </p>
        </div>
      </div>
    </footer>
  );
}
