import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-top">
          <div className="lp-footer-brand-block">
            <span className="lp-footer-brand">{t("brand")}</span>
            <p className="lp-footer-tagline">{t("tagline")}</p>
          </div>
        </div>
        <div className="lp-footer-divider"></div>
        <div className="lp-footer-bottom">
          <nav className="lp-footer-nav">
            <a href="#produit">{t("produit")}</a>
            <Link href="/pricing">{t("tarifs")}</Link>
            <Link href="/magazine">{t("magazine")}</Link>
            <Link href="/faq">{t("faq")}</Link>
            <Link href="/privacy">{t("confidentialite")}</Link>
            <Link href="/cgu">{t("cgu")}</Link>
            <Link href="/contact">{t("contact")}</Link>
          </nav>
          <p className="lp-footer-copy">
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
