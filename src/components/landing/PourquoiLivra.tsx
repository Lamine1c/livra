import { getTranslations } from "next-intl/server";

export default async function PourquoiLivra() {
  const t = await getTranslations("PourquoiLivra");
  return (
    <>
      <section className="pql" data-screen-label="Pourquoi LIVRA ?">
        <div className="pql-inner">
          <p className="pql-eyebrow pql-anim"><span className="pql-pip"></span>{t("eyebrow")}</p>
          <h2 className="pql-title pql-anim">{t("title")}</h2>
          <div className="pql-body pql-anim">
            <p className="pql-lead">{t("lead")}</p>
            <p>{t("p1Before")}<strong className="pql-key">{t("p1Key")}</strong>{t("p1After")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3Before")}<strong className="pql-key">{t("p3Key")}</strong>{t("p3After")}</p>
            <p>{t("p4Before")}<strong className="pql-key">{t("p4Key")}</strong>{t("p4After")}</p>
            <p>{t("p5")}</p>
            <p>{t("p6")}</p>
            <p>{t("p7Before")}<strong className="pql-key">{t("p7Key")}</strong>{t("p7After")}</p>
            <p className="pql-turn">{t("turn")}</p>
            <p>{t("p8")}</p>
          </div>
        </div>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
