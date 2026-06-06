const SbLight = () => (
  <span className="sb-r">
    <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#F5F0E8"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
    <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#F5F0E8" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#F5F0E8" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#F5F0E8"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#F5F0E8" opacity="0.6"/></svg>
  </span>
);
const SbDark = () => (
  <span className="sb-r">
    <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E9EDEF"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
    <svg width="16" height="11" viewBox="0 0 16 11"><path fill="#E9EDEF" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#E9EDEF" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#E9EDEF"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#E9EDEF" opacity="0.6"/></svg>
  </span>
);

export default function Otp() {
  return (
    <>
      <section className="section4" data-screen-label="Section 4 — OTP anti fausses commandes">
        <div className="section4__inner">
          <header className="section4__header">
            <p className="s4-eyebrow s4-rise"><span className="s4-pip"></span>Le bouclier LIVRA</p>
            <h2 className="s4-title s4-rise">LIVRA <em>tue</em> les fausses commandes.</h2>
            <p className="s4-sub s4-rise">
              Fini les retours. Fini les touristes. Fini les scammers.
              <strong>Chaque commande validée par code OTP WhatsApp</strong> — avant que le livreur bouge.
            </p>
            <div className="s4-flow s4-rise">
              <span className="s4-step">Commande</span><span className="s4-arr">→</span>
              <span className="s4-step">OTP envoyé</span><span className="s4-arr">→</span>
              <span className="s4-step pivot">Validation</span><span className="s4-arr">→</span>
              <span className="s4-step">Expédition</span>
            </div>
          </header>
          <div className="s4-stage">
            <div className="s4-tri">

              {/* MOCKUP 1 — VENDEUR déclenche */}
              <div className="s4-phone s4-phone-side s4-phone-l s4-float-a">
                <div className="s4-screen">
                  <div className="s4-notch"></div>
                  <div className="s4-statusbar"><span>9:41</span><SbLight /></div>
                  <div className="s4-scr">
                    <div className="s4-det-bar"><span className="back">‹</span><span className="ref">LV-2605-8429</span></div>
                    <div className="s4-det-status">
                      <span className="lbl"><span className="dot"></span>En attente client</span>
                      <span className="s4-pill-wait">Non validée</span>
                    </div>
                    <div className="s4-det-block">
                      <div className="sec">Client</div>
                      <div className="s4-det-row"><span className="k">Nom</span><span className="v">Lamine B.</span></div>
                      <div className="s4-det-row"><span className="k">Téléphone</span><span className="v">05 ·· ·· ·· 29</span></div>
                    </div>
                    <div className="s4-det-block">
                      <div className="sec">Articles</div>
                      <div className="s4-det-art"><span className="nm">Casque JBL TUNE 510BT</span><span className="calc">4 400 DA</span></div>
                    </div>
                    <div className="s4-actions">
                      <div className="sec">Actions livraison</div>
                      <div className="s4-cta halo">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M12 18h.01"/></svg>
                        Envoyer code OTP par WhatsApp
                      </div>
                      <p className="s4-cta-sub">Le client doit confirmer avant l&rsquo;expédition</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOCKUP 2 — CLIENT WhatsApp */}
              <div className="s4-phone s4-phone-c s4-float-c">
                <div className="s4-screen s4-client">
                  <div className="s4-notch"></div>
                  <div className="s4-statusbar dark"><span>9:41</span><SbDark /></div>
                  <div className="s4-scr" style={{ paddingTop: '50px' }}>
                    <div className="s4-wa-head">
                      <span className="back">‹</span>
                      <span className="ava">A</span>
                      <span className="who">
                        <div className="nm">Boutique Atlas</div>
                        <div className="on"><span className="live"></span>en ligne</div>
                      </span>
                      <span className="ic">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </span>
                    </div>
                    <div className="s4-wa-body">
                      <span className="s4-day">AUJOURD&rsquo;HUI</span>
                      <div className="s4-bubble recv">
                        <p className="msg" dir="auto">Bonjour Lamine 👋<br />Code de confirmation pour ta commande <b>LV-2605-8429</b> :</p>
                        <div className="s4-code">
                          <span className="digit">8</span><span className="digit">4</span><span className="digit">2</span><span className="digit">9</span>
                        </div>
                        <p className="msg" dir="auto">Réponds avec ce code pour valider ta commande.</p>
                        <div className="s4-meta"><span className="time">13:42</span></div>
                      </div>
                      <div className="s4-bubble sent">
                        <p className="msg"><span className="big-code">8429</span></p>
                        <div className="s4-meta">
                          <span className="time">13:43</span>
                          <span className="rd">
                            <svg width="16" height="11" viewBox="0 0 18 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5.5l3.2 3.2L11 2"/><path d="M7 8.7L8 9.7 14.8 3"/></svg>
                          </span>
                        </div>
                      </div>
                      <div className="s4-bubble recv">
                        <p className="msg" dir="auto">✅ Commande confirmée ! Ton colis est en préparation. Tu recevras un lien de suivi GPS dès le départ du livreur.</p>
                        <div className="s4-meta"><span className="time">13:43</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOCKUP 3 — VENDEUR reçoit validation */}
              <div className="s4-phone s4-phone-side s4-phone-r s4-float-b">
                <div className="s4-screen">
                  <div className="s4-notch"></div>
                  <div className="s4-statusbar"><span>9:41</span><SbLight /></div>
                  <div className="s4-scr">
                    <div className="s4-det-bar"><span className="back">‹</span><span className="ref">LV-2605-8429</span></div>
                    <div className="s4-det-status">
                      <span className="lbl"><span className="dot" style={{ background: 'var(--emerald-lt)', boxShadow: '0 0 8px 1px rgba(52,211,153,0.5)' }}></span>Validée par OTP</span>
                      <span className="s4-pill-ok">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        OK
                      </span>
                    </div>
                    <div className="s4-banner">
                      <span className="chk"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
                      <span className="tt">Client confirmé via OTP<br /><span>aujourd&rsquo;hui · 14:08</span></span>
                    </div>
                    <div className="s4-det-block">
                      <div className="sec">Articles</div>
                      <div className="s4-det-art"><span className="nm">Casque JBL TUNE 510BT</span><span className="calc">4 400 DA</span></div>
                    </div>
                    <div className="s4-actions">
                      <div className="sec">Actions livraison</div>
                      <div className="s4-cta">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
                        Préparer l&rsquo;expédition
                      </div>
                      <p className="s4-cta-sub">Le livreur sera notifié automatiquement</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <p className="s4-caption">Aperçu réel du flow OTP LIVRA — vendeur, client, vendeur.</p>
          <div className="lp-cta-wrap">
            <a className="lp-cta" href="/pricing">Éliminez les fausses commandes</a>
            <p className="lp-cta-sub">7 jours gratuit. Aucun contrat.</p>
          </div>
        </div>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
