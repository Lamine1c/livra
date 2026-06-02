import styles from './Tracking.module.css';

/* Tracking — porté depuis la maquette HTML validée.
   Composant serveur : aucune interactivité JS (animations en CSS, FAQ en <details> natif).
   Police Inter via next/font ; tokens couleur via globals.css. */
export default function Tracking() {
  return (
    <section className={styles['s6']} data-screen-label="Section 6 — Tracking">
        <div className={styles['s6-inner']}>

          {/* ── Header ─────────────────────────────────────────── */}
          <header className={styles['s6-anchor']}>
            <p className={styles['s6-eyebrow']}><span className={styles['s6-pip']}></span>La confiance LIVRA</p>
            <h2 className={styles['s6-h2']}>Tracking en direct <em>=</em> Confiance <em>=</em> Fidélisation</h2>
            <p className={styles['s6-sub']}>
              Votre client voit le livreur arriver en direct. Plus d'appels « où est mon colis&nbsp;? ».
              <strong>Plus d'anxiété. Plus d'annulations</strong> à la dernière minute.
            </p>
            <div className={styles['s6-pills']}>
              <span className={styles['s6-pill']}>Livreur part</span><span className={styles['s6-arr']}>→</span>
              <span className={styles['s6-pill']}>Lien WA</span><span className={styles['s6-arr']}>→</span>
              <span className={`${styles['s6-pill']} ${styles['s6-pill-pivot']}`}>Map live</span><span className={styles['s6-arr']}>→</span>
              <span className={styles['s6-pill']}>Livré</span>
            </div>
          </header>

          {/* ── Triptyque ──────────────────────────────────────── */}
          <div className={styles['s6-stage']}>
            <div className={styles['s6-mockups']}>

              {/* ░░ GAUCHE — VENDEUR : lien position envoyé ░░ */}
              <div className={`${styles['s6-phone']} ${styles['s6-phone-l']}`}>
                <div className={styles['s6-screen']}>
                  <div className={styles['s6-notch']}></div>
                  <div className={styles['s6-statusbar']}>
                    <span>9:41</span>
                    <span className={styles['s6-sbR']}>
                      <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#F5F0E8"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
                      <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#F5F0E8" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
                      <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#F5F0E8" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#F5F0E8"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#F5F0E8" opacity="0.6"/></svg>
                    </span>
                  </div>
                  <div className={styles['s6-scr']}>
                    <div className={styles['s6-list-head']}>
                      <span className={styles['t']}>Commandes</span>
                      <span className={styles['all']}>Aujourd'hui</span>
                    </div>

                    <div className={`${styles['s6-ord']} ${styles['live']}`}>
                      <span className={styles['av']}>LB</span>
                      <span className={styles['mid']}>
                        <div className={styles['cn']}>Lamine B.</div>
                        <div className={styles['rf']}>LV-2605-8429</div>
                      </span>
                      <span className={styles['rt']}>
                        <div className={styles['amt']}>4 400 DA</div>
                        <div className={`${styles['st']} ${styles['cours']}`}><span className={styles['s6-gpsdot']}></span>En cours</div>
                      </span>
                    </div>

                    <div className={styles['s6-ord']}>
                      <span className={styles['av']}>YK</span>
                      <span className={styles['mid']}>
                        <div className={styles['cn']}>Yacine K.</div>
                        <div className={styles['rf']}>LV-2605-8417</div>
                      </span>
                      <span className={styles['rt']}>
                        <div className={styles['amt']}>7 900 DA</div>
                        <div className={`${styles['st']} ${styles['done']}`}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          Livrée
                        </div>
                      </span>
                    </div>

                    <div className={styles['s6-ord']}>
                      <span className={styles['av']}>SD</span>
                      <span className={styles['mid']}>
                        <div className={styles['cn']}>Sara D.</div>
                        <div className={styles['rf']}>LV-2605-8402</div>
                      </span>
                      <span className={styles['rt']}>
                        <div className={styles['amt']}>2 600 DA</div>
                        <div className={`${styles['st']} ${styles['wait']}`}>À préparer</div>
                      </span>
                    </div>

                    <div className={styles['s6-ord']}>
                      <span className={styles['av']}>NM</span>
                      <span className={styles['mid']}>
                        <div className={styles['cn']}>Nadia M.</div>
                        <div className={styles['rf']}>LV-2605-8388</div>
                      </span>
                      <span className={styles['rt']}>
                        <div className={styles['amt']}>5 200 DA</div>
                        <div className={`${styles['st']} ${styles['done']}`}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          Livrée
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ░░ CENTRE — CLIENT : message + page locate (héro) ░░ */}
              <div className={`${styles['s6-phone']} ${styles['s6-phone-c']}`}>
                <div className={styles['s6-screen']}>
                  <div className={styles['s6-notch']}></div>
                  <div className={`${styles['s6-statusbar']} ${styles['dark']}`}>
                    <span>9:41</span>
                    <span className={styles['s6-sbR']}>
                      <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E9EDEF"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
                      <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#E9EDEF" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
                      <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#E9EDEF" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#E9EDEF"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#E9EDEF" opacity="0.6"/></svg>
                    </span>
                  </div>
                  <div className={`${styles['s6-scr']} ${styles['s6-scr-full']}`}>
                    <div className={styles['s6-split']}>

                      {/* haut : conversation WhatsApp */}
                      <div className={styles['s6-chat']}>
                        <div className={styles['s6-wa-head']} style={{ paddingTop: '54px' }}>
                          <span className={styles['back']}>‹</span>
                          <span className={styles['ava']}>A</span>
                          <span className={styles['who']}>
                            <div className={styles['nm']}>Boutique Atlas</div>
                            <div className={styles['on']}><span className={styles['live']}></span>en ligne</div>
                          </span>
                          <span className={styles['ic']}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          </span>
                        </div>
                        <div className={styles['s6-wa-body']}>
                          <span className={styles['s6-day']}>AUJOURD'HUI</span>
                          <div className={`${styles['s6-bubble']} ${styles['recv']}`}>
                            <p className={styles['msg']} dir="auto">🛵 Ta commande <b>LV-2605-8429</b> est en route&nbsp;! Suis ton livreur en direct&nbsp;:</p>
                            <p className={styles['msg']} dir="auto" style={{ marginTop: '6px' }}>👉 <span className={styles['link']}>golivra.app/track/8429</span></p>
                            <div className={styles['s6-meta']}><span className={styles['time']}>14:32</span></div>
                          </div>
                        </div>
                      </div>

                      {/* bas : page golivra.app/track (carte live) */}
                      <div className={styles['s6-track']}>
                        <div className={styles['urlbar']}>
                          <span className={styles['urlchip']}>
                            <span className={styles['lockico']}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
                            golivra.app/track/8429
                          </span>
                        </div>
                        <div className={styles['tmap']}>
                          <svg viewBox="0 0 320 360" preserveAspectRatio="xMidYMid slice">
                            <rect className={styles['s6-block']} x="14" y="20" width="120" height="120" rx="6"/>
                            <rect className={styles['s6-block']} x="182" y="20" width="124" height="120" rx="6"/>
                            <rect className={styles['s6-block']} x="14" y="180" width="120" height="160" rx="6"/>
                            <rect className={styles['s6-block']} x="182" y="180" width="124" height="160" rx="6"/>
                            <path className={`${styles['s6-street']} ${styles['maj']}`} d="M0 160 H320"/>
                            <path className={`${styles['s6-street']} ${styles['maj']}`} d="M160 0 V360"/>
                            <path className={styles['s6-street']} d="M70 0 V360"/>
                            <path className={styles['s6-street']} d="M250 0 V360"/>
                            <path className={styles['s6-route']} d="M122 208 V160 H224 V94"/>
                          </svg>
                          <span className={styles['s6-livreur']}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M5.5 17.5h7l4-9h2"/><path d="M9 17.5l3-6.5"/></svg>
                          </span>
                          <span className={styles['s6-home']}></span>
                        </div>
                        <div className={styles['tsheet']}>
                          <div className={styles['teta']}>
                            <span className={styles['ic']}>🛵</span>
                            <span className={styles['tx']}>
                              <div className={styles['lab']}>Votre livreur</div>
                              <div className={styles['big']}>Arrive dans <b>6 min</b></div>
                            </span>
                          </div>
                          <div className={styles['s6-prog']}><i></i></div>
                          <div className={styles['s6-prog-lbl']}><span>Pris en charge</span><span><b>1,4 km</b> restants</span></div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* ░░ DROITE — VENDEUR : livrée + avis client ░░ */}
              <div className={`${styles['s6-phone']} ${styles['s6-phone-r']}`}>
                <div className={styles['s6-screen']}>
                  <div className={styles['s6-notch']}></div>
                  <div className={`${styles['s6-statusbar']} ${styles['dark']}`}>
                    <span>9:41</span>
                    <span className={styles['s6-sbR']}>
                      <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E9EDEF"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
                      <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#E9EDEF" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
                      <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#E9EDEF" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#E9EDEF"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#E9EDEF" opacity="0.6"/></svg>
                    </span>
                  </div>
                  <div className={styles['s6-scr']}>
                    <div className={styles['s6-det-bar']}>
                      <span className={styles['back']}>‹</span>
                      <span className={styles['ref']}>LV-2605-8429</span>
                    </div>
                    <div className={styles['s6-deliv-hero']}>
                      <span className={styles['chk']}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </span>
                      <div className={styles['tt']}>Livrée</div>
                      <div className={styles['ts']}>Aujourd'hui · 14:41 · remise en main propre</div>
                    </div>
                    <div className={styles['s6-rate']}>
                      <div className={styles['lbl']}>Avis client</div>
                      <div className={styles['s6-stars']}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.8L12 17.8 5.9 20.8 7.1 14l-5-4.8 6.9-.9z"/></svg>
                      </div>
                      <div className={styles['s6-rev']}>
                        <span className={styles['qa']}>“</span>
                        <span className={styles['qt']} dir="auto">Merci, livreur très pro 👌
                          <span className={styles['who']}>Lamine B. — client</span>
                        </span>
                      </div>
                    </div>
                    <div className={styles['s6-det-block']}>
                      <div className={styles['sec']}>Articles</div>
                      <div className={styles['s6-det-art']}>
                        <span className={styles['nm']}>Casque JBL TUNE 510BT</span>
                        <span className={styles['calc']}>4 400 DA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── CTA + caption ──────────────────────────────────── */}
          <div className={styles['s6-cta-wrap']}>
            <a className={styles['s6-cta-btn']} href="#">+ Ventes, + fidélisation</a>
            <p className={styles['s6-cta-sub']}>7 jours gratuit. Aucun contrat.</p>
          </div>

          <p className={styles['s6-caption']}>Aperçu réel du tracking LIVRA — vendeur, client, livraison réussie.</p>

        </div>
      </section>
  );
}
