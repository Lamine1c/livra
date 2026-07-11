import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Footer site — visuel pleine largeur calqué sur landing/Footer (le footer LP
// "gagnant"). Styles .sf-* scopés ici (zéro dépendance à livra-landing.css),
// tokens Onyx v1 depuis globals.css. mt-auto = sticky-footer sur pages courtes.
export default function Footer() {
  const t = useTranslations("Footer");
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
            <span className="sf-brand">{t("brand")}</span>
            <p className="sf-tagline">{t("tagline")}</p>
          </div>
        </div>

        <div className="sf-divider" />

        <div className="sf-bottom">
          <nav className="sf-nav" aria-label={t("navAria")}>
            <Link href="/#produit">{t("produit")}</Link>
            <Link href="/pricing">{t("tarifs")}</Link>
            <Link href="/magazine">{t("magazine")}</Link>
            <Link href="/faq">{t("faq")}</Link>
            <Link href="/privacy">{t("confidentialite")}</Link>
            <Link href="/cgu">{t("cgu")}</Link>
            <Link href="/contact">{t("contact")}</Link>
          </nav>
          <p className="sf-copy">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
