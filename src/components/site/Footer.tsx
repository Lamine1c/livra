import Link from "next/link";

// Footer site — visuel pleine largeur calqué sur landing/Footer (le footer LP
// "gagnant"). Styles .sf-* scopés ici (zéro dépendance à livra-landing.css),
// tokens Onyx v1 depuis globals.css. mt-auto = sticky-footer sur pages courtes.
export default function Footer() {
  return (
    <footer className="sf mt-auto">
      <style>{`
        .sf {
          background: var(--noir-deep);
          border-top: 1px solid var(--hair);
          padding: 56px 24px 32px;
          color: rgba(245,240,232,0.7);
          position: relative; z-index: 2;
        }
        .sf-inner { max-width: 1180px; margin: 0 auto; }
        .sf-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 40px; flex-wrap: wrap; margin-bottom: 32px;
        }
        .sf-brand-block { flex: 1; min-width: 240px; }
        .sf-brand {
          font-size: 24px; font-weight: 800; color: var(--ivoire);
          letter-spacing: -0.02em; display: block; margin-bottom: 8px;
        }
        .sf-tagline { font-size: 14px; color: rgba(245,240,232,0.55); margin: 0; }
        .sf-divider { height: 1px; background: var(--hair); margin: 24px 0; }
        .sf-bottom {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px;
        }
        .sf-nav { display: flex; gap: 24px; flex-wrap: wrap; }
        .sf-nav a {
          color: rgba(245,240,232,0.55); font-size: 13px; text-decoration: none;
          transition: color 0.2s ease;
        }
        .sf-nav a:hover { color: var(--ivoire); }
        .sf-copy { font-size: 12px; color: rgba(245,240,232,0.4); margin: 0; }

        @media (max-width: 700px) {
          .sf-top { flex-direction: column; gap: 24px; }
          .sf-bottom { flex-direction: column; align-items: flex-start; gap: 20px; }
        }
      `}</style>

      <div className="sf-inner">
        <div className="sf-top">
          <div className="sf-brand-block">
            <span className="sf-brand">LIVRA</span>
            <p className="sf-tagline">La transaction protégée des deux côtés.</p>
          </div>
        </div>

        <div className="sf-divider" />

        <div className="sf-bottom">
          <nav className="sf-nav" aria-label="Liens du pied de page">
            <Link href="/#produit">Produit</Link>
            <Link href="/pricing">Tarifs</Link>
            <Link href="/magazine">Magazine</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/privacy">Confidentialité</Link>
            <Link href="/cgu">CGU</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p className="sf-copy">© 2026 LIVRA · LIVRA Technologies (9516-1998 Quebec Inc.)</p>
        </div>
      </div>
    </footer>
  );
}
