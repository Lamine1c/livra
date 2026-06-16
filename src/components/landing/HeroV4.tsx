import LivraLogoHorizontal from '@/components/brand/LivraLogoHorizontal';

export default function HeroV4() {
  return (
    <>
      <section className="hero" data-screen-label="Hero">
        <nav className="nav">
          <LivraLogoHorizontal height={22} />
          <div className="nav-links">
            <a href="#produit">Produit</a><a href="/pricing">Tarifs</a><a href="/telecharger">Télécharger</a>
            <a href="/telecharger" className="nav-login">Se connecter</a>
          </div>
          <div className="nav-burger" aria-label="Menu"><span></span><span></span><span></span></div>
        </nav>

        <div className="bg" aria-hidden="true">
          <div className="ghosts">
            <div className="card g1"><div className="c-head"><span className="c-av" style={{ '--av': '#D97757' } as React.CSSProperties}>A</span><span className="c-name">Anis F.</span></div><p className="c-text">9olbi yrouh quand ychouf &laquo;&nbsp;commande annulée &raquo; f 1ère ligne de la matinée.</p><span className="c-time">il y a 7h</span></div>
            <div className="card g2"><div className="c-head"><span className="c-av" style={{ '--av': '#D17861' } as React.CSSProperties}>W</span><span className="c-name">Walid H.</span></div><p className="c-text">Excel f téléphone, screenshots f WA, w cahier f sac. Nakhdem wla nfantasme ?</p><span className="c-time">il y a 6h</span></div>
            <div className="card g3"><div className="c-head"><span className="c-av" style={{ '--av': '#C9954D' } as React.CSSProperties}>S</span><span className="c-name">Sami O.</span></div><p className="c-text">Krahna men colis en instance, w men &laquo;&nbsp;rappelez-moi demain &raquo;.</p><span className="c-time">il y a 30 min</span></div>
            <div className="card g4"><div className="c-head"><span className="c-av" style={{ '--av': '#3a6b54' } as React.CSSProperties}>A</span><span className="c-name">Amine S.</span></div><p className="c-text">Rani l&rsquo;aman… 4 colis COD radjou, w l&rsquo;cahier dssil fih lokhrin.</p><span className="c-time">hier</span></div>
            <div className="card g5"><div className="c-head"><span className="c-av" style={{ '--av': '#C9954D' } as React.CSSProperties}>R</span><span className="c-name">Ryad B.</span></div><p className="c-text">Confirmation par WA, par tel, par DM… w client yqolik &laquo;&nbsp;machi ana &raquo;.</p><span className="c-time">hier</span></div>
            <div className="card g6"><div className="c-head"><span className="c-av" style={{ '--av': '#3a6b54' } as React.CSSProperties}>M</span><span className="c-name">Mehdi L.</span></div><p className="c-text">Le livreur ma rd-ch l&rsquo;cash hier, w rani na3ref weh fin houwa.</p><span className="c-time">il y a 4h</span></div>
            <div className="card g7"><div className="c-head"><span className="c-av" style={{ '--av': '#9CA3AF' } as React.CSSProperties}>N</span><span className="c-name">Nassim K.</span></div><p className="c-text">H24 connecté sur Messenger, tgoul rani f central téléphonique.</p><span className="c-time">à l&rsquo;instant</span></div>
            <div className="card g8"><div className="c-head"><span className="c-av" style={{ '--av': '#D17861' } as React.CSSProperties}>B</span><span className="c-name">Bilal Z.</span></div><p className="c-text">Yalidine, Maystro, Noest… chaque société 7essab fih, w ana en plein milieu.</p><span className="c-time">hier</span></div>
            <div className="card g9"><div className="c-head"><span className="c-av" style={{ '--av': '#D97757' } as React.CSSProperties}>H</span><span className="c-name">Hocine R.</span></div><p className="c-text">Lead Meta b 2$ w yji ydir &laquo;&nbsp;just looking &raquo;.</p><span className="c-time">il y a 1h</span></div>
            <div className="card g10"><div className="c-head"><span className="c-av" style={{ '--av': '#C9954D' } as React.CSSProperties}>F</span><span className="c-name">Farouk D.</span></div><p className="c-text">Wech ndir b had l&rsquo;colis ? Client ma yjaweb-ch men 3 jours.</p><span className="c-time">il y a 5h</span></div>
          </div>

          <div className="sharp">
            <div className="card s-tl"><div className="c-head"><span className="c-av" style={{ '--av': '#D97757' } as React.CSSProperties}>K</span><span className="c-name">Karim B.</span></div><p className="c-text">Sahbi wech rahi commande ta3i ? 3 ayyam w mazal walou.</p><span className="c-time">il y a 2h</span></div>
            <div className="card s-tr"><div className="c-head"><span className="c-av" style={{ '--av': '#D17861' } as React.CSSProperties}>Y</span><span className="c-name">Yacine T.</span></div><p className="c-text">30% retour hada machi business, hada masse men ness yetlebou w ymchiw.</p><span className="c-time">il y a 3h</span></div>
            <div className="card s-bl"><div className="c-head"><span className="c-av" style={{ '--av': '#C9954D' } as React.CSSProperties}>S</span><span className="c-name">Sofiane M.</span></div><p className="c-text">Wech ndir b had l&rsquo;colis ? Client ma yjaweb-ch.</p><span className="c-time">il y a 5h</span></div>
            <div className="card s-mr"><div className="c-head"><span className="c-av" style={{ '--av': '#9CA3AF' } as React.CSSProperties}>S</span><span className="c-name">Sami O.</span></div><p className="c-text">Krahna men colis en instance, w &laquo;&nbsp;rappelez-moi demain&nbsp;&raquo;.</p><span className="c-time">il y a 30 min</span></div>
          </div>
        </div>

        <div className="fg">
          <div className="copy">
            <p className="kicker an" style={{ '--d': '120ms' } as React.CSSProperties}><span className="pip"></span>L&rsquo;OS de votre e-commerce</p>
            <h1 className="an" style={{ '--d': '220ms' } as React.CSSProperties}><span className="hl-1">Sortez de la</span><span className="hl-2"><span className="accent">jungle.</span></span></h1>
            <p className="subtitle an" style={{ '--d': '360ms' } as React.CSSProperties}><strong>Commandes en auto, confirmations, Tracking Uber style, Suivi COD.</strong> Une seule app pour tout piloter.</p>
            <div className="cta an" style={{ '--d': '500ms' } as React.CSSProperties}><a className="btn" href="/pricing">Commencer gratuitement</a></div>
            <p className="micro an" style={{ '--d': '640ms' } as React.CSSProperties}>Rejoignez les vendeurs qui ont quitté la jungle.</p>
          </div>

          <div className="product an" style={{ '--d': '420ms' } as React.CSSProperties}>
            <div className="panel">
              <div className="p-top">
                <div>
                  <div className="p-title">Commandes <b>·</b> aujourd&rsquo;hui</div>
                  <div className="p-sub">42 confirmées · 6 en tournée</div>
                </div>
                <div className="p-tabs">
                  <span className="p-tab on">Toutes</span><span className="p-tab">COD</span><span className="p-tab">Statut</span>
                </div>
              </div>
              <div className="rows">
                <div className="row"><span className="ini" style={{ background: '#D97757' }}>K</span><div><div className="r-name">Karim Benali</div><div className="r-meta">Alger Centre · #LV-2841</div></div><div className="r-right"><div className="r-amt">5 400 DA</div><span className="badge b-ok"><span className="b-dot"></span>Livré</span></div></div>
                <div className="row"><span className="ini" style={{ background: '#C9954D' }}>Y</span><div><div className="r-name">Yacine Toumi</div><div className="r-meta">Oran · #LV-2840</div></div><div className="r-right"><div className="r-amt">12 900 DA</div><span className="badge b-go"><span className="b-dot"></span>En tournée</span></div></div>
                <div className="row"><span className="ini" style={{ background: '#3a6b54' }}>A</span><div><div className="r-name">Amel Saïdi</div><div className="r-meta">Constantine · #LV-2839</div></div><div className="r-right"><div className="r-amt">3 200 DA</div><span className="badge b-ok"><span className="b-dot"></span>Livré</span></div></div>
                <div className="row"><span className="ini" style={{ background: '#9CA3AF' }}>S</span><div><div className="r-name">Sofiane Mansouri</div><div className="r-meta">Blida · #LV-2838</div></div><div className="r-right"><div className="r-amt">7 750 DA</div><span className="badge b-wait"><span className="b-dot"></span>À confirmer</span></div></div>
              </div>
            </div>

            <div className="livemap">
              <div className="map">
                <div className="streets"></div>
                <div className="vignette"></div>
                <svg className="route-svg" viewBox="0 0 288 146" preserveAspectRatio="none" aria-hidden="true">
                  <path className="route-bg" d="M 24 124 C 70 118, 58 78, 120 78 S 210 68, 248 25"></path>
                  <path className="route-fg" d="M 24 124 C 70 118, 58 78, 120 78 S 210 68, 248 25" pathLength="100" strokeDasharray="66 100"></path>
                </svg>
                <span className="dest"></span>
                <span className="courier"></span>
                <span className="map-badge"><span className="live"></span>En direct</span>
              </div>
              <div className="map-foot">
                <div className="mf-top"><span className="mf-name">Colis #LV-2840</span><span className="mf-eta">ETA 22 min</span></div>
                <div className="mf-sub">Yacine T. · en route vers Oran · livreur Bilal</div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-hint"><span className="line"></span>Découvrir</div>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
