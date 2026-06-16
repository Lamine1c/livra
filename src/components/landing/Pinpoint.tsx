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

export default function Pinpoint() {
  return (
    <>
      <section className="s5" data-screen-label="Section 5 — Pinpoint">
        <div className="s5-inner">
          <header className="s5-anchor">
            <p className="s5-eyebrow"><span className="s5-pip"></span>Le wedge LIVRA</p>
            <h2 className="s5-h2">LIVRA <em>tue</em> les colis perdus.</h2>
            <div className="s5-copy">
              <div className="pain-sol">
                <p className="pain">Adresse écrite à l&apos;arrache. Livreur qui tourne en rond. Client qui décroche pas. 3 appels pour une seule livraison.</p>
                <p className="sol">Avec LIVRA, ton client partage sa position GPS par <span className="wa">WhatsApp</span> en un tap. Le livreur le trouve <strong>direct — sans un seul appel</strong>.</p>
              </div>
              <p className="punch"><em>Zéro</em> adresse à taper. <em>Zéro</em> appel. <em>Zéro</em> colis perdu.</p>
            </div>
            <div className="s5-pills">
              <span className="s5-pill">Lien WA</span><span className="s5-arr">→</span>
              <span className="s5-pill s5-pill-pivot">Tap</span><span className="s5-arr">→</span>
              <span className="s5-pill">Position</span><span className="s5-arr">→</span>
              <span className="s5-pill">Livraison</span>
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
                    <div className="s5-det-bar"><span className="back">‹</span><span className="ref">LV-2605-8429</span></div>
                    <div className="s5-det-status">
                      <span className="lbl"><span className="dot"></span>Validée par OTP</span>
                      <span className="s5-pill-ok">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        OK
                      </span>
                    </div>
                    <div className="s5-det-block">
                      <div className="sec">Client</div>
                      <div className="s5-det-row"><span className="k">Nom</span><span className="v">Lamine B.</span></div>
                      <div className="s5-det-row"><span className="k">Téléphone</span><span className="v">05 ·· ·· ·· 29</span></div>
                    </div>
                    <div className="s5-det-block">
                      <div className="sec">Articles</div>
                      <div className="s5-det-art"><span className="nm">Casque JBL TUNE 510BT</span><span className="calc">4 400 DA</span></div>
                    </div>
                  </div>
                  <div className="s5-pop-scrim">
                    <div className="s5-popup">
                      <div className="ring">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <p className="tt">Lien de position envoyé au client</p>
                      <p className="ss">Il n&rsquo;a qu&rsquo;à toucher un bouton pour partager où livrer.</p>
                      <span className="wa-tag">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z"/></svg>
                        Envoyé par WhatsApp
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
                            <div className="nm">Boutique Atlas</div>
                            <div className="on"><span className="live"></span>en ligne</div>
                          </span>
                          <span className="ic">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          </span>
                        </div>
                        <div className="s5-wa-body">
                          <span className="s5-day">AUJOURD&rsquo;HUI</span>
                          <div className="s5-bubble recv">
                            <p className="msg" dir="auto">Bonjour Lamine 👋<br />Merci pour ta commande <b>LV-2605-8429</b>. Confirme ta position pour la livraison :</p>
                            <p className="msg" dir="auto" style={{ marginTop: '6px' }}>👉 <span className="link">golivra.app/locate/8429</span></p>
                            <div className="s5-meta"><span className="time">13:46</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="s5-locate">
                        <span className="urlchip">
                          <span className="lockico"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
                          golivra.app/locate/8429
                        </span>
                        <div className="brand">LIV<b>R</b>A</div>
                        <p className="lt">Confirme ta position</p>
                        <p className="ls">Pour que le livreur arrive direct, sans appel.</p>
                        <span className="s5-locate-btn" aria-hidden="true">
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
                          Confirmer ma position
                        </span>
                        <p className="bsub">1 tap. Aucune adresse à taper.</p>
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
                        <text className="s5-streetlbl" x="172" y="225" transform="rotate(0 172 225)">Bd 11 décembre</text>
                      </svg>
                      <span className="s5-start"></span>
                      <span className="s5-dest">
                        <span className="pulse"></span>
                        <svg width="30" height="38" viewBox="0 0 24 30" fill="currentColor"><path d="M12 0a10 10 0 0 0-10 10c0 7 10 18 10 18s10-11 10-18A10 10 0 0 0 12 0z"/><circle cx="12" cy="10" r="4" fill="#101216"/></svg>
                      </span>
                      <div className="s5-nav-top">
                        <span className="arr"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg></span>
                        <span className="nt">
                          <div className="road">Boulevard 11 décembre</div>
                          <div className="hint">Tournez à droite dans 200 m</div>
                        </span>
                        <span className="eta"><div className="big">8 min</div><div className="sm">2,1 km</div></span>
                      </div>
                      <div className="s5-nav-sheet">
                        <div className="row">
                          <span className="pic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
                          <span className="who"><div className="n">Lamine B.</div><div className="a">Position GPS confirmée</div></span>
                          <span className="go">En route</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <p className="s5-caption">Aperçu réel du flow Pinpoint LIVRA — vendeur, client, livreur.</p>
          <div className="lp-cta-wrap">
            <a className="lp-cta" href="/pricing">Localisé, confirmé, le livreur déjà parti</a>
            <p className="lp-cta-sub">7 jours gratuit. Aucun contrat.</p>
          </div>
        </div>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
