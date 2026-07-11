import { getTranslations } from "next-intl/server";

export default async function Philosophy() {
  const t = await getTranslations("Philosophy");
  return (
    <>
      <section id="wilayas" className="s75" data-screen-label="Section 7.5 — Notre philosophie" style={{ scrollMarginTop: '20px' }}>
        <div className="s75-inner">
          <p className="s75-eyebrow"><span className="s75-pip"></span>{t("eyebrow")}</p>
          <h2 className="s75-statement">
            {t("statement_line1")}
            {t("statement_line2_before")}<em>{t("statement_line2_em")}</em>{t("statement_line2_after")}
            {t("statement_line3")}
          </h2>
          <p className="s75-body">
            {t("body_line1")}
            {t("body_line2")}
            <strong>{t("body_strong")}</strong><br />{t("body_line3")}
          </p>
          <hr className="s75-rule" />
          <div className="s75-credo">
            <div className="s75-tenet">
              <span className="no">{t("tenet1_no")}</span>
              <p className="t">{t("tenet1_title")}</p>
              <p className="d">{t("tenet1_desc")}</p>
            </div>
            <div className="s75-tenet">
              <span className="no">{t("tenet2_no")}</span>
              <p className="t">{t("tenet2_title")}</p>
              <p className="d">{t("tenet2_desc")}</p>
            </div>
            <div className="s75-tenet">
              <span className="no">{t("tenet3_no")}</span>
              <p className="t">{t("tenet3_title")}</p>
              <p className="d">{t("tenet3_desc")}</p>
            </div>
          </div>
          <hr className="s75-rule" />
          <div className="s75-cards">
            <article className="s75-card">
              <span className="s75-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
              </span>
              <div className="s75-ctext">
                <h3 className="s75-ctitle"><span className="num">{t("card1_title_num")}</span>{t("card1_title_after")}</h3>
                <p className="s75-cbody">{t("card1_body")}</p>
              </div>
              <div className="s75-tags">
                <span className="s75-tag">{t("card1_tag1")}</span>
                <span className="s75-tag">{t("card1_tag2")}</span>
                <span className="s75-tag">{t("card1_tag3")}</span>
                <span className="s75-tag">{t("card1_tag4")}</span>
                <span className="s75-tag more">{t("card1_tag_more")}</span>
              </div>
            </article>
            <article className="s75-card">
              <span className="s75-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>
              </span>
              <div className="s75-ctext">
                <h3 className="s75-ctitle">{t("card2_title")}</h3>
                <p className="s75-cbody">{t("card2_body")}</p>
              </div>
            </article>
            <article className="s75-card">
              <span className="s75-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 20l1-3.5A8.3 8.3 0 0 1 3 12 8.5 8.5 0 0 1 11.5 3.5 8.4 8.4 0 0 1 21 11.5z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>
              </span>
              <div className="s75-ctext">
                <h3 className="s75-ctitle">{t("card3_title")}</h3>
                <p className="s75-cbody">{t("card3_body")}</p>
              </div>
            </article>
            <article className="s75-card">
              <span className="s75-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V5.5z"/><path d="M9 12l2 2 4-4"/></svg>
              </span>
              <div className="s75-ctext">
                <h3 className="s75-ctitle">{t("card4_title")}</h3>
                <p className="s75-cbody">{t("card4_body")}</p>
              </div>
            </article>
          </div>
          <hr className="s75-rule" />
          <p className="s75-sign"><span className="em-dash">—</span>{t("sign_before")}<b>{t("sign_brand")}</b>{t("sign_after")}</p>
        </div>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
