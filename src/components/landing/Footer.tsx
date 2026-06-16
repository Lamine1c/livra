export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-top">
          <div className="lp-footer-brand-block">
            <span className="lp-footer-brand">LIVRA</span>
            <p className="lp-footer-tagline">L&rsquo;OS de votre e-commerce.</p>
          </div>
        </div>
        <div className="lp-footer-divider"></div>
        <div className="lp-footer-bottom">
          <nav className="lp-footer-nav">
            <a href="#produit">Produit</a>
            <a href="/pricing">Tarifs</a>
            <a href="/privacy">Confidentialité</a>
            <a href="/cgu">CGU</a>
          </nav>
          <p className="lp-footer-copy">
            © 2026 LIVRA · Godzii Media (9516-1998 Quebec Inc.)
          </p>
        </div>
      </div>
    </footer>
  );
}
