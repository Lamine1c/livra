import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const SbLight = () => (
  <span className="s6-sbR">
    <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#F5F0E8"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
    <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#F5F0E8" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#F5F0E8" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#F5F0E8"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#F5F0E8" opacity="0.6"/></svg>
  </span>
);
const SbDark = () => (
  <span className="s6-sbR">
    <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E9EDEF"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
    <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#E9EDEF" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#E9EDEF" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#E9EDEF"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#E9EDEF" opacity="0.6"/></svg>
  </span>
);

export default async function Tracking() {
  const t = await getTranslations("Tracking");
  return (
    <>
      <section className="s6" data-screen-label="Section 6 — Tracking">
        <div className="s6-inner">
          <header className="s6-anchor">
            <p className="s6-eyebrow"><span className="s6-pip"></span>{t("eyebrow")}</p>
            <h2 className="s6-h2">{t("title_before")}<em>{t("title_em1")}</em>{t("title_mid")}<em>{t("title_em2")}</em>{t("title_after")}</h2>
            <p className="s6-sub">
              {t("sub_line1")}
              <strong>{t("sub_strong")}</strong>{t("sub_line2")}
            </p>
            <div className="s6-pills">
              <span className="s6-pill">{t("pill1")}</span><span className="s6-arr">→</span>
              <span className="s6-pill">{t("pill2")}</span><span className="s6-arr">→</span>
              <span className="s6-pill s6-pill-pivot">{t("pill3")}</span><span className="s6-arr">→</span>
              <span className="s6-pill">{t("pill4")}</span>
            </div>
          </header>
          <div className="s6-stage">
            <div className="s6-mockups">

              {/* GAUCHE — VENDEUR : liste commandes avec GPS dot */}
              <div className="s6-phone s6-phone-l">
                <div className="s6-screen">
                  <div className="s6-notch"></div>
                  <div className="s6-statusbar"><span>9:41</span><SbLight /></div>
                  <div className="s6-scr">
                    <div className="s6-list-head">
                      <span className="t">{t("m1_list_title")}</span>
                      <span className="all">{t("m1_list_all")}</span>
                    </div>
                    <div className="s6-ord live">
                      <span className="av">LB</span>
                      <span className="mid">
                        <div className="cn">{t("m1_ord1_name")}</div>
                        <div className="rf">{t("m1_ord1_ref")}</div>
                      </span>
                      <span className="rt">
                        <div className="amt">{t("m1_ord1_amt")}</div>
                        <div className="st cours"><span className="s6-gpsdot"></span>{t("m1_ord1_status")}</div>
                      </span>
                    </div>
                    <div className="s6-ord">
                      <span className="av">YK</span>
                      <span className="mid">
                        <div className="cn">{t("m1_ord2_name")}</div>
                        <div className="rf">{t("m1_ord2_ref")}</div>
                      </span>
                      <span className="rt">
                        <div className="amt">{t("m1_ord2_amt")}</div>
                        <div className="st done">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          {t("m1_ord2_status")}
                        </div>
                      </span>
                    </div>
                    <div className="s6-ord">
                      <span className="av">SD</span>
                      <span className="mid">
                        <div className="cn">{t("m1_ord3_name")}</div>
                        <div className="rf">{t("m1_ord3_ref")}</div>
                      </span>
                      <span className="rt">
                        <div className="amt">{t("m1_ord3_amt")}</div>
                        <div className="st wait">{t("m1_ord3_status")}</div>
                      </span>
                    </div>
                    <div className="s6-ord">
                      <span className="av">NM</span>
                      <span className="mid">
                        <div className="cn">{t("m1_ord4_name")}</div>
                        <div className="rf">{t("m1_ord4_ref")}</div>
                      </span>
                      <span className="rt">
                        <div className="amt">{t("m1_ord4_amt")}</div>
                        <div className="st done">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          {t("m1_ord4_status")}
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTRE — CLIENT : WA + page track live */}
              <div className="s6-phone s6-phone-c">
                <div className="s6-screen">
                  <div className="s6-notch"></div>
                  <div className="s6-statusbar dark"><span>9:41</span><SbDark /></div>
                  <div className="s6-scr s6-scr-full">
                    <div className="s6-split">
                      <div className="s6-chat">
                        <div className="s6-wa-head" style={{ paddingTop: '54px' }}>
                          <span className="back">‹</span>
                          <span className="ava">A</span>
                          <span className="who">
                            <div className="nm">{t("m2_shop_name")}</div>
                            <div className="on"><span className="live"></span>{t("m2_online")}</div>
                          </span>
                          <span className="ic">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          </span>
                        </div>
                        <div className="s6-wa-body">
                          <span className="s6-day">{t("m2_day")}</span>
                          <div className="s6-bubble recv">
                            <p className="msg" dir="auto">{t("m2_msg1_before")}<b>{t("m2_msg1_ref")}</b>{t("m2_msg1_after")}</p>
                            <p className="msg" dir="auto" style={{ marginTop: '6px' }}>👉 <span className="link">{t("m2_msg2_link")}</span></p>
                            <div className="s6-meta"><span className="time">{t("m2_time")}</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="s6-track">
                        <div className="urlbar">
                          <span className="urlchip">
                            <span className="lockico"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
                            {t("m2_urlchip")}
                          </span>
                        </div>
                        <div className="tmap">
                          <svg viewBox="0 0 320 360" preserveAspectRatio="xMidYMid slice">
                            <rect className="s6-block" x="14" y="20" width="120" height="120" rx="6"/>
                            <rect className="s6-block" x="182" y="20" width="124" height="120" rx="6"/>
                            <rect className="s6-block" x="14" y="180" width="120" height="160" rx="6"/>
                            <rect className="s6-block" x="182" y="180" width="124" height="160" rx="6"/>
                            <path className="s6-street maj" d="M0 160 H320"/>
                            <path className="s6-street maj" d="M160 0 V360"/>
                            <path className="s6-street" d="M70 0 V360"/>
                            <path className="s6-street" d="M250 0 V360"/>
                            <path className="s6-route" d="M122 208 V160 H224 V94"/>
                          </svg>
                          <span className="s6-livreur">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M5.5 17.5h7l4-9h2"/><path d="M9 17.5l3-6.5"/></svg>
                          </span>
                          <span className="s6-home"></span>
                        </div>
                        <div className="tsheet">
                          <div className="teta">
                            <span className="ic">🛵</span>
                            <span className="tx">
                              <div className="lab">{t("m2_eta_lab")}</div>
                              <div className="big">{t("m2_eta_before")}<b>{t("m2_eta_val")}</b></div>
                            </span>
                          </div>
                          <div className="s6-prog"><i></i></div>
                          <div className="s6-prog-lbl"><span>{t("m2_prog_start")}</span><span><b>{t("m2_prog_end_val")}</b>{t("m2_prog_end_after")}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DROITE — VENDEUR : livrée + avis client */}
              <div className="s6-phone s6-phone-r">
                <div className="s6-screen">
                  <div className="s6-notch"></div>
                  <div className="s6-statusbar dark"><span>9:41</span><SbDark /></div>
                  <div className="s6-scr">
                    <div className="s6-det-bar">
                      <span className="back">‹</span>
                      <span className="ref">{t("m3_ref")}</span>
                    </div>
                    <div className="s6-deliv-hero">
                      <span className="chk">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </span>
                      <div className="tt">{t("m3_deliv_title")}</div>
                      <div className="ts">{t("m3_deliv_sub")}</div>
                    </div>
                    <div className="s6-rate">
                      <div className="lbl">{t("m3_rate_lbl")}</div>
                      <div className="s6-stars">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                      </div>
                      <div className="s6-rev">
                        <span className="qa">&ldquo;</span>
                        <span className="qt" dir="auto">{t("m3_review")}
                          <span className="who">{t("m3_review_who")}</span>
                        </span>
                      </div>
                    </div>
                    <div className="s6-det-block">
                      <div className="sec">{t("m3_articles_sec")}</div>
                      <div className="s6-det-art">
                        <span className="nm">{t("m3_article_name")}</span>
                        <span className="calc">{t("m3_article_price")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <p className="s6-caption">{t("caption")}</p>
          <div className="lp-cta-wrap">
            <Link className="lp-cta" href="/pricing">{t("cta")}</Link>
            <p className="lp-cta-sub">{t("cta_sub")}</p>
          </div>
        </div>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
