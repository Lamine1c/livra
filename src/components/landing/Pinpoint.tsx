import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const SbLight = () => (
  <span className="s5-sbR">
    <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#F5F0E8"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
    <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#F5F0E8" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#F5F0E8" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#F5F0E8"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#F5F0E8" opacity="0.6"/></svg>
  </span>
);
const SbDark = () => (
  <span className="s5-sbR">
    <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E9EDEF"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
    <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#E9EDEF" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#E9EDEF" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#E9EDEF"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#E9EDEF" opacity="0.6"/></svg>
  </span>
);

export default async function Pinpoint() {
  const t = await getTranslations("Pinpoint");
  return (
    <>
      <section className="s5" data-screen-label="Section 5 — Pinpoint">
        <div className="s5-inner">
          <header className="s5-anchor">
            <p className="s5-eyebrow"><span className="s5-pip"></span>{t("eyebrow")}</p>
            <h2 className="s5-h2">{t("title_before")}<em>{t("title_em")}</em>{t("title_after")}</h2>
            <div className="s5-copy">
              <div className="pain-sol">
                <p className="pain">{t("pain")}</p>
                <p className="sol">{t("sol_before")}<span className="wa">{t("sol_wa")}</span>{t("sol_mid")}<strong>{t("sol_strong")}</strong>{t("sol_after")}</p>
              </div>
              <p className="punch"><em>{t("punch_em1")}</em>{t("punch_mid1")}<em>{t("punch_em2")}</em>{t("punch_mid2")}<em>{t("punch_em3")}</em>{t("punch_after")}</p>
            </div>
            <div className="s5-pills">
              <span className="s5-pill">{t("pill1")}</span><span className="s5-arr">→</span>
              <span className="s5-pill s5-pill-pivot">{t("pill2")}</span><span className="s5-arr">→</span>
              <span className="s5-pill">{t("pill3")}</span><span className="s5-arr">→</span>
              <span className="s5-pill">{t("pill4")}</span>
            </div>
          </header>
          <div className="s5-stage">
            <div className="s5-mockups">

              {/* GAUCHE — VENDEUR */}
              <div className="s5-phone s5-phone-l">
                <div className="s5-screen">
                  <div className="s5-notch"></div>
                  <div className="s5-statusbar"><span>9:41</span><SbLight /></div>
                  <div className="s5-scr">
                    <div className="s5-det-bar"><span className="back">‹</span><span className="ref">{t("m1_ref")}</span></div>
                    <div className="s5-det-status">
                      <span className="lbl"><span className="dot"></span>{t("m1_status")}</span>
                      <span className="s5-pill-ok">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        {t("m1_pill_ok")}
                      </span>
                    </div>
                    <div className="s5-det-block">
                      <div className="sec">{t("m1_client_sec")}</div>
                      <div className="s5-det-row"><span className="k">{t("m1_client_name_k")}</span><span className="v">{t("m1_client_name_v")}</span></div>
                      <div className="s5-det-row"><span className="k">{t("m1_client_phone_k")}</span><span className="v">{t("m1_client_phone_v")}</span></div>
                    </div>
                    <div className="s5-det-block">
                      <div className="sec">{t("m1_articles_sec")}</div>
                      <div className="s5-det-art"><span className="nm">{t("m1_article_name")}</span><span className="calc">{t("m1_article_price")}</span></div>
                    </div>
                  </div>
                  <div className="s5-pop-scrim">
                    <div className="s5-popup">
                      <div className="ring">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <p className="tt">{t("m1_popup_title")}</p>
                      <p className="ss">{t("m1_popup_sub")}</p>
                      <span className="wa-tag">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z"/></svg>
                        {t("m1_wa_tag")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTRE — CLIENT */}
              <div className="s5-phone s5-phone-c">
                <div className="s5-screen">
                  <div className="s5-notch"></div>
                  <div className="s5-statusbar dark"><span>9:41</span><SbDark /></div>
                  <div className="s5-scr s5-scr-full">
                    <div className="s5-split">
                      <div className="s5-chat">
                        <div className="s5-wa-head" style={{ paddingTop: '54px' }}>
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
                        <div className="s5-wa-body">
                          <span className="s5-day">{t("m2_day")}</span>
                          <div className="s5-bubble recv">
                            <p className="msg" dir="auto">{t("m2_msg1_line1")}<br />{t("m2_msg1_line2_before")}<b>{t("m2_msg1_ref")}</b>{t("m2_msg1_after")}</p>
                            <p className="msg" dir="auto" style={{ marginTop: '6px' }}>👉 <span className="link">{t("m2_msg2_link")}</span></p>
                            <div className="s5-meta"><span className="time">{t("m2_time")}</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="s5-locate">
                        <span className="urlchip">
                          <span className="lockico"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
                          {t("m2_urlchip")}
                        </span>
                        <div className="brand">LIV<b>R</b>A</div>
                        <p className="lt">{t("m2_locate_title")}</p>
                        <p className="ls">{t("m2_locate_sub")}</p>
                        <span className="s5-locate-btn" aria-hidden="true">
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
                          {t("m2_locate_btn")}
                        </span>
                        <p className="bsub">{t("m2_locate_bsub")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DROITE — LIVREUR */}
              <div className="s5-phone s5-phone-r">
                <div className="s5-screen">
                  <div className="s5-notch"></div>
                  <div className="s5-statusbar dark"><span>9:41</span><SbDark /></div>
                  <div className="s5-scr s5-scr-full">
                    <div className="s5-map">
                      <svg viewBox="0 0 320 700" preserveAspectRatio="xMidYMid slice">
                        <rect className="s5-block" x="18" y="60" width="120" height="150" rx="6"/>
                        <rect className="s5-block" x="186" y="60" width="116" height="150" rx="6"/>
                        <rect className="s5-block" x="18" y="250" width="120" height="170" rx="6"/>
                        <rect className="s5-block" x="186" y="250" width="116" height="170" rx="6"/>
                        <rect className="s5-block" x="18" y="460" width="120" height="180" rx="6"/>
                        <rect className="s5-block" x="186" y="460" width="116" height="180" rx="6"/>
                        <path className="s5-street maj" d="M0 235 H320"/>
                        <path className="s5-street maj" d="M160 0 V700"/>
                        <path className="s5-street" d="M0 445 H320"/>
                        <path className="s5-street" d="M0 120 H320"/>
                        <path className="s5-street" d="M70 0 V700"/>
                        <path className="s5-street" d="M250 0 V700"/>
                        <path className="s5-route" d="M96 490 V445 H160 V235 H211"/>
                        <text className="s5-streetlbl" x="172" y="225" transform="rotate(0 172 225)">{t("m3_street_label")}</text>
                      </svg>
                      <span className="s5-start"></span>
                      <span className="s5-dest">
                        <span className="pulse"></span>
                        <svg width="30" height="38" viewBox="0 0 24 30" fill="currentColor"><path d="M12 0a10 10 0 0 0-10 10c0 7 10 18 10 18s10-11 10-18A10 10 0 0 0 12 0z"/><circle cx="12" cy="10" r="4" fill="#101216"/></svg>
                      </span>
                      <div className="s5-nav-top">
                        <span className="arr"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg></span>
                        <span className="nt">
                          <div className="road">{t("m3_nav_road")}</div>
                          <div className="hint">{t("m3_nav_hint")}</div>
                        </span>
                        <span className="eta"><div className="big">{t("m3_eta_big")}</div><div className="sm">{t("m3_eta_sm")}</div></span>
                      </div>
                      <div className="s5-nav-sheet">
                        <div className="row">
                          <span className="pic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
                          <span className="who"><div className="n">{t("m3_who_name")}</div><div className="a">{t("m3_who_addr")}</div></span>
                          <span className="go">{t("m3_go")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <p className="s5-caption">{t("caption")}</p>
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
