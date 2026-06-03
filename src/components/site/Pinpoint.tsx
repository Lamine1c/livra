import styles from './Pinpoint.module.css';
import SectionCta from './SectionCta';

/* Pinpoint — porté depuis la maquette HTML validée.
   Composant serveur : aucune interactivité JS (animations en CSS, FAQ en <details> natif).
   Police Inter via next/font ; tokens couleur via globals.css. */
export default function Pinpoint() {
  return (
    <>
    <section className={styles['s5']} data-screen-label="Section 5 — Pinpoint">
        <div className={styles['s5-inner']}>

          {/* ── Header ─────────────────────────────────────────── */}
          <header className={styles['s5-anchor']}>
            <p className={styles['s5-eyebrow']}><span className={styles['s5-pip']}></span>Le wedge LIVRA</p>
            <h2 className={styles['s5-h2']}>LIVRA <em>tue</em> les colis perdus.</h2>
            <p className={styles['s5-sub']}>
              Adresses inutiles, livreurs perdus, clients qui ne répondent plus.
              <strong>LIVRA partage la position GPS du client par WhatsApp</strong> — en un tap.
            </p>
            <div className={styles['s5-pills']}>
              <span className={styles['s5-pill']}>Lien WA</span><span className={styles['s5-arr']}>→</span>
              <span className={`${styles['s5-pill']} ${styles['s5-pill-pivot']}`}>Tap</span><span className={styles['s5-arr']}>→</span>
              <span className={styles['s5-pill']}>Position</span><span className={styles['s5-arr']}>→</span>
              <span className={styles['s5-pill']}>Livraison</span>
            </div>
          </header>

          {/* ── Triptyque ──────────────────────────────────────── */}
          <div className={styles['s5-stage']}>
            <div className={styles['s5-mockups']}>

              {/* ░░ GAUCHE — VENDEUR : lien position envoyé ░░ */}
              <div className={`${styles['s5-phone']} ${styles['s5-phone-l']}`}>
                <div className={styles['s5-screen']}>
                  <div className={styles['s5-notch']}></div>
                  <div className={styles['s5-statusbar']}>
                    <span>9:41</span>
                    <span className={styles['s5-sbR']}>
                      <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#F5F0E8"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
                      <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#F5F0E8" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
                      <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#F5F0E8" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#F5F0E8"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#F5F0E8" opacity="0.6"/></svg>
                    </span>
                  </div>
                  <div className={styles['s5-scr']}>
                    <div className={styles['s5-det-bar']}>
                      <span className={styles['back']}>‹</span>
                      <span className={styles['ref']}>LV-2605-8429</span>
                    </div>
                    <div className={styles['s5-det-status']}>
                      <span className={styles['lbl']}><span className={styles['dot']}></span>Validée par OTP</span>
                      <span className={styles['s5-pill-ok']}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        OK
                      </span>
                    </div>
                    <div className={styles['s5-det-block']}>
                      <div className={styles['sec']}>Client</div>
                      <div className={styles['s5-det-row']}><span className={styles['k']}>Nom</span><span className={styles['v']}>Lamine B.</span></div>
                      <div className={styles['s5-det-row']}><span className={styles['k']}>Téléphone</span><span className={styles['v']}>05 ·· ·· ·· 29</span></div>
                    </div>
                    <div className={styles['s5-det-block']}>
                      <div className={styles['sec']}>Articles</div>
                      <div className={styles['s5-det-art']}>
                        <span className={styles['nm']}>Casque JBL TUNE 510BT</span>
                        <span className={styles['calc']}>4 400 DA</span>
                      </div>
                    </div>
                  </div>
                  {/* popup centré : lien position envoyé */}
                  <div className={styles['s5-pop-scrim']}>
                    <div className={styles['s5-popup']}>
                      <div className={styles['ring']}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <p className={styles['tt']}>Lien de position envoyé au client</p>
                      <p className={styles['ss']}>Il n'a qu'à toucher un bouton pour partager où livrer.</p>
                      <span className={styles['wa-tag']}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z"/></svg>
                        Envoyé par WhatsApp
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ░░ CENTRE — CLIENT : message + page locate (héro) ░░ */}
              <div className={`${styles['s5-phone']} ${styles['s5-phone-c']}`}>
                <div className={styles['s5-screen']}>
                  <div className={styles['s5-notch']}></div>
                  <div className={`${styles['s5-statusbar']} ${styles['dark']}`}>
                    <span>9:41</span>
                    <span className={styles['s5-sbR']}>
                      <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E9EDEF"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
                      <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#E9EDEF" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
                      <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#E9EDEF" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#E9EDEF"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#E9EDEF" opacity="0.6"/></svg>
                    </span>
                  </div>
                  <div className={`${styles['s5-scr']} ${styles['s5-scr-full']}`}>
                    <div className={styles['s5-split']}>

                      {/* haut : conversation WhatsApp */}
                      <div className={styles['s5-chat']}>
                        <div className={styles['s5-wa-head']} style={{ paddingTop: '54px' }}>
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
                        <div className={styles['s5-wa-body']}>
                          <span className={styles['s5-day']}>AUJOURD'HUI</span>
                          <div className={`${styles['s5-bubble']} ${styles['recv']}`}>
                            <p className={styles['msg']} dir="auto">Bonjour Lamine 👋<br />Merci pour ta commande <b>LV-2605-8429</b>. Confirme ta position pour la livraison :</p>
                            <p className={styles['msg']} dir="auto" style={{ marginTop: '6px' }}>👉 <span className={styles['link']}>golivra.app/locate/8429</span></p>
                            <div className={styles['s5-meta']}><span className={styles['time']}>13:46</span></div>
                          </div>
                        </div>
                      </div>

                      {/* bas : page golivra.app/locate */}
                      <div className={styles['s5-locate']}>
                        <span className={styles['urlchip']}>
                          <span className={styles['lockico']}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
                          golivra.app/locate/8429
                        </span>
                        <div className={styles['brand']}>LIV<b>R</b>A</div>
                        <p className={styles['lt']}>Confirme ta position</p>
                        <p className={styles['ls']}>Pour que le livreur arrive direct, sans appel.</p>
                        <a className={styles['s5-locate-btn']} href="#">
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
                          Confirmer ma position
                        </a>
                        <p className={styles['bsub']}>1 tap. Aucune adresse à taper.</p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* ░░ DROITE — LIVREUR : navigation vers le client ░░ */}
              <div className={`${styles['s5-phone']} ${styles['s5-phone-r']}`}>
                <div className={styles['s5-screen']}>
                  <div className={styles['s5-notch']}></div>
                  <div className={`${styles['s5-statusbar']} ${styles['dark']}`}>
                    <span>9:41</span>
                    <span className={styles['s5-sbR']}>
                      <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E9EDEF"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
                      <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#E9EDEF" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
                      <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#E9EDEF" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#E9EDEF"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#E9EDEF" opacity="0.6"/></svg>
                    </span>
                  </div>
                  <div className={`${styles['s5-scr']} ${styles['s5-scr-full']}`}>
                    <div className={styles['s5-map']}>
                      <svg viewBox="0 0 320 700" preserveAspectRatio="xMidYMid slice">
                        {/* blocs */}
                        <rect className={styles['s5-block']} x="18" y="60" width="120" height="150" rx="6"/>
                        <rect className={styles['s5-block']} x="186" y="60" width="116" height="150" rx="6"/>
                        <rect className={styles['s5-block']} x="18" y="250" width="120" height="170" rx="6"/>
                        <rect className={styles['s5-block']} x="186" y="250" width="116" height="170" rx="6"/>
                        <rect className={styles['s5-block']} x="18" y="460" width="120" height="180" rx="6"/>
                        <rect className={styles['s5-block']} x="186" y="460" width="116" height="180" rx="6"/>
                        {/* rues */}
                        <path className={`${styles['s5-street']} ${styles['maj']}`} d="M0 235 H320"/>
                        <path className={`${styles['s5-street']} ${styles['maj']}`} d="M160 0 V700"/>
                        <path className={styles['s5-street']} d="M0 445 H320"/>
                        <path className={styles['s5-street']} d="M0 120 H320"/>
                        <path className={styles['s5-street']} d="M70 0 V700"/>
                        <path className={styles['s5-street']} d="M250 0 V700"/>
                        {/* trajet */}
                        <path className={styles['s5-route']} d="M96 490 V445 H160 V235 H211"/>
                        {/* libellé rue */}
                        <text className={styles['s5-streetlbl']} x="172" y="225" transform="rotate(0 172 225)">Bd 11 décembre</text>
                      </svg>
                      <span className={styles['s5-start']}></span>
                      <span className={styles['s5-dest']}>
                        <span className={styles['pulse']}></span>
                        <svg width="30" height="38" viewBox="0 0 24 30" fill="currentColor"><path d="M12 0a10 10 0 0 0-10 10c0 7 10 18 10 18s10-11 10-18A10 10 0 0 0 12 0z"/><circle cx="12" cy="10" r="4" fill="#101216"/></svg>
                      </span>

                      <div className={styles['s5-nav-top']}>
                        <span className={styles['arr']}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
                        </span>
                        <span className={styles['nt']}>
                          <div className={styles['road']}>Boulevard 11 décembre</div>
                          <div className={styles['hint']}>Tournez à droite dans 200 m</div>
                        </span>
                        <span className={styles['eta']}>
                          <div className={styles['big']}>8 min</div>
                          <div className={styles['sm']}>2,1 km</div>
                        </span>
                      </div>

                      <div className={styles['s5-nav-sheet']}>
                        <div className={styles['row']}>
                          <span className={styles['pic']}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                          </span>
                          <span className={styles['who']}>
                            <div className={styles['n']}>Lamine B.</div>
                            <div className={styles['a']}>Position GPS confirmée</div>
                          </span>
                          <span className={styles['go']}>En route</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── CTA + caption ──────────────────────────────────── */}
          <div className={styles['s5-cta-wrap']}>
            <a className={styles['s5-cta-btn']} href="#">Localisé, confirmé, le livreur déjà parti</a>
            <p className={styles['s5-cta-sub']}>7 jours gratuit. Aucun contrat.</p>
          </div>

          <p className={styles['s5-caption']}>Aperçu réel du flow Pinpoint LIVRA — vendeur, client, livreur.</p>

        </div>
      </section>
      <SectionCta
        label="Localisé, confirmé, le livreur déjà parti !!"
        subtext="7 jours gratuit. Aucun contrat."
      />
    </>
  );
}
