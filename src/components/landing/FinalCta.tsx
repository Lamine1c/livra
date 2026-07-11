import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function FinalCta() {
  const t = await getTranslations("FinalCta");
  return (
    <section id="tarifs" className="s9" data-screen-label="Section 9 — CTA Final" style={{ scrollMarginTop: '20px' }}>
      <div className="s9-inner">
        <p className="s9-eyebrow"><span className="s9-pip"></span>{t("eyebrow")}</p>
        <h2 className="s9-h2">{t("h2")}</h2>
        <p className="s9-sub">{t("sub")}</p>
        <Link className="s9-cta" href="/pricing">
          {t("cta")}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
        </Link>
        <p className="s9-assure">{t("assureBefore")}<span className="sep">{t("assureSep")}</span>{t("assureAfter")}</p>
      </div>
    </section>
  );
}
