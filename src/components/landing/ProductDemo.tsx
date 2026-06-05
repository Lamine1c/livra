const SbLight = () => (
  <span className="sb-r">
    <svg width="17" height="11" viewBox="0 0 17 11"><g fill="var(--ivoire)"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
    <svg width="16" height="11" viewBox="0 0 16 11"><path fill="var(--ivoire)" d="M8 2.2c2.1 0 4 .8 5.4 2.1l1.2-1.3C13 1.2 10.6.3 8 .3S3 1.2 1.4 3l1.2 1.3C4 3 5.9 2.2 8 2.2zm0 3.5c1.1 0 2.2.5 3 1.2l1.2-1.3C11.1 4.5 9.6 3.9 8 3.9s-3.1.6-4.2 1.7l1.2 1.3c.8-.7 1.9-1.2 3-1.2zM8 7.4l1.8 2L8 11.3 6.2 9.4 8 7.4z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="var(--ivoire)" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="var(--ivoire)"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="var(--ivoire)" opacity="0.6"/></svg>
  </span>
);

export default function ProductDemo() {
  return (
    <>
      <section id="produit" className="section1" data-screen-label="Section 1 — Démo produit" style={{ scrollMarginTop: '20px' }}>
        <div className="section1__inner">
          <div className="section1__anchor">
            <p className="section1__eyebrow"><span className="section1__pip"></span>Une seule app</p>
            <h2 className="section1__h2">De la commande au scan, tout dans une app.</h2>
            <p className="section1__sub">
              Une commande créée. Un QR généré. Un livreur qui scanne. Un colis suivi en direct.
              <strong>Plus de cahier, plus de capture d&rsquo;écran, plus de colis perdu.</strong>
            </p>
            <div className="section1__pills">
              <span className="section1__pill">Commande</span><span className="section1__arrow">→</span>
              <span className="section1__pill">QR</span><span className="section1__arrow">→</span>
              <span className="section1__pill section1__pill--pivot">Scan</span><span className="section1__arrow">→</span>
              <span className="section1__pill">Suivi</span>
            </div>
          </div>
          <div className="section1__stage">
            <div className="section1__mockups">

              {/* MOCKUP 1 — DASHBOARD */}
              <div className="section1__phone section1__phone--left">
                <div className="section1__screen">
                  <div className="section1__notch"></div>
                  <div className="section1__statusbar"><span>9:41</span><SbLight /></div>
                  <div className="s1-scr">
                    <div className="s1-dash">
                      <p className="s1-dash__hi">Bonjour 👋</p>
                      <p className="s1-dash__name">lamine</p>
                      <p className="s1-dash__sub">Voici votre journée</p>
                      <div className="s1-dash__avatar">L</div>
                    </div>
                    <div className="s1-statGrid">
                      <div className="s1-stat">
                        <div className="s1-stat__ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg></div>
                        <div className="s1-stat__lbl">Commandes</div>
                        <div className="s1-stat__num">38</div>
                        <div className="s1-stat__delta s1-em">+1 aujourd&rsquo;hui</div>
                      </div>
                      <div className="s1-stat">
                        <div className="s1-stat__ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                        <div className="s1-stat__lbl">En attente</div>
                        <div className="s1-stat__num">7</div>
                        <div className="s1-stat__delta s1-am">À traiter</div>
                      </div>
                      <div className="s1-stat">
                        <div className="s1-stat__ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg></div>
                        <div className="s1-stat__lbl">Livrées</div>
                        <div className="s1-stat__num">17</div>
                        <div className="s1-stat__delta s1-md">Aucune aujourd&rsquo;hui</div>
                      </div>
                      <div className="s1-stat s1-stat--glow">
                        <div className="s1-stat__ic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--s1-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg></div>
                        <div className="s1-stat__lbl">CA du jour</div>
                        <div className="s1-stat__num">4 750 DA</div>
                        <div className="s1-stat__delta s1-em">Premier jour !</div>
                      </div>
                    </div>
                    <div className="s1-listHead">
                      <span className="s1-listHead__t">Dernières commandes</span>
                      <span className="s1-listHead__all">Voir tout →</span>
                    </div>
                    <div className="s1-ord">
                      <span className="s1-ord__av">A</span>
                      <div className="s1-ord__mid"><div className="s1-ord__cn">Ahmed</div><div className="s1-ord__ref">LV-2605-8429</div></div>
                      <div className="s1-ord__right"><div className="s1-ord__amt">4 750 DA</div><div className="s1-ord__st"><span className="dot" style={{ background: 'var(--s1-ambre)' }}></span>En attente</div></div>
                    </div>
                    <div className="s1-ord">
                      <span className="s1-ord__av">S</span>
                      <div className="s1-ord__mid"><div className="s1-ord__cn">Sarah</div><div className="s1-ord__ref">LV-2605-1038</div></div>
                      <div className="s1-ord__right"><div className="s1-ord__amt">2 200 DA</div><div className="s1-ord__st"><span className="dot" style={{ background: 'var(--s1-mist-dim)' }}></span>En traitement</div></div>
                    </div>
                    <div className="s1-ord">
                      <span className="s1-ord__av">T</span>
                      <div className="s1-ord__mid"><div className="s1-ord__cn">test android</div><div className="s1-ord__ref">LV-2605-4902</div></div>
                      <div className="s1-ord__right"><div className="s1-ord__amt">2 200 DA</div><div className="s1-ord__st"><span className="dot" style={{ background: 'var(--s1-accent)' }}></span>Livrée</div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOCKUP 2 — QR COMMANDE */}
              <div className="section1__phone section1__phone--center">
                <div className="section1__screen">
                  <div className="section1__notch"></div>
                  <div className="section1__statusbar"><span>9:41</span><SbLight /></div>
                  <div className="s1-scr">
                    <div className="s1-detBar"><span className="s1-detBar__back">‹</span><span className="s1-detBar__ref">LV-2605-8429</span></div>
                    <div className="s1-detStatus"><span className="s1-detStatus__lbl"><span className="dot"></span>Expédiée</span><span className="s1-detStatus__chg">Changer statut</span></div>
                    <div className="s1-detBlock">
                      <div className="s1-detBlock__sec">Informations</div>
                      <div className="s1-detRow"><span className="k">Référence</span><span className="v">LV-2605-8429</span></div>
                      <div className="s1-detRow"><span className="k">Date</span><span className="v">29/05/2026 22:49</span></div>
                    </div>
                    <div className="s1-detBlock">
                      <div className="s1-detBlock__sec">Articles</div>
                      <div className="s1-detArt">
                        <span className="s1-detArt__nm">Casque JBL TUNE 510BT</span>
                        <span className="s1-detArt__calc">2 × 2 200 DA<b>= 4 400 DA</b></span>
                      </div>
                      <div className="s1-detSep"></div>
                      <div className="s1-detRow"><span className="k">Sous-total</span><span className="v">4 400 DA</span></div>
                      <div className="s1-detRow"><span className="k">Livraison</span><span className="v">350 DA</span></div>
                      <div className="s1-detSep"></div>
                      <div className="s1-detTot"><span className="k">Total</span><span className="v">4 750 DA</span></div>
                    </div>
                    <div className="s1-detBlock">
                      <div className="s1-detBlock__sec">Actions livraison</div>
                      <div className="s1-qrWrap">
                        <div className="s1-qr" aria-hidden="true">
                          <svg viewBox="0 0 25 25" shapeRendering="crispEdges"><path fill="currentColor" d="M0 0h1v1h-1zM1 0h1v1h-1zM2 0h1v1h-1zM3 0h1v1h-1zM4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM8 0h1v1h-1zM11 0h1v1h-1zM14 0h1v1h-1zM16 0h1v1h-1zM18 0h1v1h-1zM19 0h1v1h-1zM20 0h1v1h-1zM21 0h1v1h-1zM22 0h1v1h-1zM23 0h1v1h-1zM24 0h1v1h-1zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM11 1h1v1h-1zM14 1h1v1h-1zM18 1h1v1h-1zM24 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM11 2h1v1h-1zM15 2h1v1h-1zM16 2h1v1h-1zM18 2h1v1h-1zM20 2h1v1h-1zM21 2h1v1h-1zM22 2h1v1h-1zM24 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM11 3h1v1h-1zM12 3h1v1h-1zM13 3h1v1h-1zM14 3h1v1h-1zM15 3h1v1h-1zM18 3h1v1h-1zM20 3h1v1h-1zM21 3h1v1h-1zM22 3h1v1h-1zM24 3h1v1h-1zM0 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h1v1h-1zM12 4h1v1h-1zM13 4h1v1h-1zM15 4h1v1h-1zM16 4h1v1h-1zM18 4h1v1h-1zM20 4h1v1h-1zM21 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM16 5h1v1h-1zM18 5h1v1h-1zM24 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM11 6h1v1h-1zM14 6h1v1h-1zM18 6h1v1h-1zM19 6h1v1h-1zM20 6h1v1h-1zM21 6h1v1h-1zM22 6h1v1h-1zM23 6h1v1h-1zM24 6h1v1h-1zM9 7h1v1h-1zM12 7h1v1h-1zM13 7h1v1h-1zM15 7h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM9 8h1v1h-1zM12 8h1v1h-1zM14 8h1v1h-1zM15 8h1v1h-1zM17 8h1v1h-1zM18 8h1v1h-1zM20 8h1v1h-1zM22 8h1v1h-1zM24 8h1v1h-1zM0 9h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM4 9h1v1h-1zM6 9h1v1h-1zM9 9h1v1h-1zM11 9h1v1h-1zM12 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM19 9h1v1h-1zM20 9h1v1h-1zM21 9h1v1h-1zM22 9h1v1h-1zM24 9h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM21 10h1v1h-1zM22 10h1v1h-1zM1 11h1v1h-1zM2 11h1v1h-1zM6 11h1v1h-1zM8 11h1v1h-1zM10 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM17 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM21 11h1v1h-1zM1 12h1v1h-1zM2 12h1v1h-1zM3 12h1v1h-1zM4 12h1v1h-1zM5 12h1v1h-1zM7 12h1v1h-1zM8 12h1v1h-1zM14 12h1v1h-1zM16 12h1v1h-1zM17 12h1v1h-1zM21 12h1v1h-1zM22 12h1v1h-1zM2 13h1v1h-1zM3 13h1v1h-1zM4 13h1v1h-1zM7 13h1v1h-1zM9 13h1v1h-1zM10 13h1v1h-1zM12 13h1v1h-1zM13 13h1v1h-1zM14 13h1v1h-1zM15 13h1v1h-1zM17 13h1v1h-1zM19 13h1v1h-1zM0 14h1v1h-1zM1 14h1v1h-1zM2 14h1v1h-1zM3 14h1v1h-1zM6 14h1v1h-1zM9 14h1v1h-1zM10 14h1v1h-1zM15 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM4 15h1v1h-1zM6 15h1v1h-1zM7 15h1v1h-1zM8 15h1v1h-1zM10 15h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM16 15h1v1h-1zM18 15h1v1h-1zM20 15h1v1h-1zM21 15h1v1h-1zM22 15h1v1h-1zM23 15h1v1h-1zM24 15h1v1h-1zM0 16h1v1h-1zM1 16h1v1h-1zM5 16h1v1h-1zM7 16h1v1h-1zM9 16h1v1h-1zM10 16h1v1h-1zM11 16h1v1h-1zM12 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM19 16h1v1h-1zM23 16h1v1h-1zM24 16h1v1h-1zM8 17h1v1h-1zM10 17h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM15 17h1v1h-1zM18 17h1v1h-1zM20 17h1v1h-1zM21 17h1v1h-1zM24 17h1v1h-1zM0 18h1v1h-1zM1 18h1v1h-1zM2 18h1v1h-1zM3 18h1v1h-1zM4 18h1v1h-1zM5 18h1v1h-1zM6 18h1v1h-1zM9 18h1v1h-1zM13 18h1v1h-1zM16 18h1v1h-1zM17 18h1v1h-1zM18 18h1v1h-1zM22 18h1v1h-1zM23 18h1v1h-1zM0 19h1v1h-1zM6 19h1v1h-1zM8 19h1v1h-1zM10 19h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM18 19h1v1h-1zM19 19h1v1h-1zM20 19h1v1h-1zM21 19h1v1h-1zM23 19h1v1h-1zM0 20h1v1h-1zM2 20h1v1h-1zM3 20h1v1h-1zM4 20h1v1h-1zM6 20h1v1h-1zM10 20h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM15 20h1v1h-1zM18 20h1v1h-1zM21 20h1v1h-1zM22 20h1v1h-1zM0 21h1v1h-1zM2 21h1v1h-1zM3 21h1v1h-1zM4 21h1v1h-1zM6 21h1v1h-1zM11 21h1v1h-1zM13 21h1v1h-1zM18 21h1v1h-1zM21 21h1v1h-1zM0 22h1v1h-1zM2 22h1v1h-1zM3 22h1v1h-1zM4 22h1v1h-1zM6 22h1v1h-1zM8 22h1v1h-1zM10 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM15 22h1v1h-1zM17 22h1v1h-1zM18 22h1v1h-1zM20 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM11 23h1v1h-1zM14 23h1v1h-1zM17 23h1v1h-1zM19 23h1v1h-1zM22 23h1v1h-1zM24 23h1v1h-1zM0 24h1v1h-1zM1 24h1v1h-1zM2 24h1v1h-1zM3 24h1v1h-1zM4 24h1v1h-1zM5 24h1v1h-1zM6 24h1v1h-1zM8 24h1v1h-1zM9 24h1v1h-1zM11 24h1v1h-1zM13 24h1v1h-1zM21 24h1v1h-1zM22 24h1v1h-1zM23 24h1v1h-1zM24 24h1v1h-1z"/></svg>
                        </div>
                        <span className="s1-qrCap">À scanner par le livreur</span>
                      </div>
                      <div className="s1-wa">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        Envoyer lien localisation WhatsApp
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOCKUP 3 — TRACKING GPS */}
              <div className="section1__phone section1__phone--right">
                <div className="section1__screen">
                  <div className="section1__notch"></div>
                  <div className="section1__statusbar"><span>9:41</span><SbLight /></div>
                  <div className="s1-scr" style={{ paddingTop: 0 }}>
                    <div className="s1-map">
                      <svg viewBox="0 0 280 606" preserveAspectRatio="xMidYMid slice">
                        <path className="street maj" d="M-10 250 Q90 210 150 250 T300 230"/>
                        <path className="street maj" d="M-10 470 Q120 450 290 480"/>
                        <path className="street" d="M40 -10 Q70 120 60 320 T90 620"/>
                        <path className="street" d="M120 -10 Q140 140 150 300 T170 620"/>
                        <path className="street" d="M210 -10 Q200 160 230 340 T210 620"/>
                        <path className="street" d="M-10 150 Q100 130 280 170"/>
                        <path className="street" d="M-10 360 Q120 340 290 380"/>
                        <path className="street" d="M-10 560 Q130 540 290 575"/>
                        <path className="street" d="M70 80 L140 130 L190 110"/>
                        <path className="street" d="M180 420 L230 470 L250 540"/>
                        <path className="street" d="M40 420 L90 460 L70 540"/>
                        <text className="lbl" x="36" y="120" transform="rotate(-6 36 120)">Bouzaréah</text>
                        <text className="lbl" x="60" y="246" transform="rotate(-8 60 246)">Boulevard 11 décembre</text>
                        <text className="lbl" x="160" y="470" transform="rotate(6 160 470)">Ben Aknoun</text>
                        <path className="route" d="M129 266 Q170 320 196 436"/>
                      </svg>
                      <div className="s1-pin"></div>
                      <div className="s1-destPin"></div>
                      <div className="s1-mapbox">
                        <span className="s1-mapbox__m"><svg width="11" height="11" viewBox="0 0 24 24" fill="#15161B"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14l-3-2-2-6 6 3 2 6-3-1z"/></svg></span>
                        mapbox
                      </div>
                      <div className="s1-sheet">
                        <div className="s1-sheet__row">
                          <span className="s1-sheet__box">📦</span>
                          <span className="s1-sheet__badge">En route vers vous</span>
                        </div>
                        <p className="s1-sheet__shop">test1</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <p className="section1__caption">Aperçu réel de l&rsquo;application LIVRA — vendeur, livreur, acheteur.</p>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
