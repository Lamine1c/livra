const HeartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>
);
const ReplyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 17l-5-5 5-5"/><path d="M4 12h11a5 5 0 0 1 5 5v2"/></svg>
);

export default function PainWall() {
  return (
    <>
      <section className="section2">
        <div className="s2-ghosts" aria-hidden="true">
          <div className="s2-ghost q1"><span className="s2-gav"></span><span className="s2-gtx"><b>Nassim K.</b>H24 sur Messenger, central téléphonique chez moi.</span></div>
          <div className="s2-ghost q2"><span className="s2-gav"></span><span className="s2-gtx"><b>Hocine R.</b>Confirmation par WA, par tel, par DM… machi ana.</span></div>
          <div className="s2-ghost q3"><span className="s2-gav"></span><span className="s2-gtx"><b>Sami O.</b>Krahna men colis en instance w « rappelez-moi demain ».</span></div>
          <div className="s2-ghost q4"><span className="s2-gav"></span><span className="s2-gtx"><b>Walid H.</b>Excel f téléphone, screenshots f WA, cahier f sac…</span></div>
          <div className="s2-ghost q5"><span className="s2-gav"></span><span className="s2-gtx"><b>Mehdi L.</b>Le livreur ma rd-ch l&rsquo;cash hier, w rani na3ref weh fin houwa.</span></div>
          <div className="s2-ghost q6"><span className="s2-gav"></span><span className="s2-gtx"><b>Amine S.</b>4 colis COD radjou, w l&rsquo;cahier ta3 commandes dssil fih.</span></div>
          <div className="s2-ghost q7"><span className="s2-gav"></span><span className="s2-gtx"><b>Bilal Z.</b>Yalidine, Maystro, Noest… chaque société 7essab, w ana f milieu.</span></div>
          <div className="s2-ghost q8"><span className="s2-gav"></span><span className="s2-gtx"><b>Riad B.</b>Lead Meta b 2$ w yji ydir « just looking ».</span></div>
          <div className="s2-ghost q9"><span className="s2-gav"></span><span className="s2-gtx"><b>Karim B.</b>3 ayyam w mazal walou, client ma yjaweb-ch.</span></div>
          <div className="s2-ghost q10"><span className="s2-gav"></span><span className="s2-gtx"><b>Sofiane M.</b>30 commandes lyoum, nconfirmiw kima les robots.</span></div>
        </div>
        <div className="s2-ghosts2" aria-hidden="true">
          <div className="s2-ghost gx1"><span className="s2-gav"></span><span className="s2-gtx"><b>Yacine T.</b>Confirmatrice dort sur les leads, mes pubs Meta cramées.</span></div>
          <div className="s2-ghost gx2"><span className="s2-gav"></span><span className="s2-gtx"><b>Imene B.</b>Client annule à la livraison, 1800 DA dans le vent. Encore.</span></div>
        </div>
        <div className="section2__inner">
          <header className="section2__header">
            <p className="section2__eyebrow"><span className="section2__pip"></span>Le quotidien actuel</p>
            <h2 className="section2__h2">Pendant ce temps, les e-commerçants souffrent…</h2>
            <p className="section2__subtitle">Des milliers de vendeurs perdent du temps, de l&rsquo;argent, et des clients.</p>
          </header>
          <div className="section2__cards">
            <article className="section2__card">
              <header className="section2__card-head">
                <span className="section2__avatar" aria-hidden="true">Y</span>
                <span className="section2__meta">
                  <span className="section2__name">Y</span>
                  <time className="section2__time" dateTime="PT4M">4 min</time>
                </span>
              </header>
              <p className="section2__text section2__text--rtl" dir="rtl" lang="ar">ما يشقوش رواحهم و يعيطولك، يبعثولك مساج SMS. كاين بزاف ناس كيما حالتي ما يقراوش SMS نهار، و يرجعوهم retour. صراتلي شحال من مرة، نعود نحلف للبائع ولله ما عيطولي.</p>
              <footer className="section2__foot">
                <span className="section2__act"><HeartIcon />12</span>
                <span className="section2__act"><ReplyIcon />3</span>
              </footer>
            </article>
            <article className="section2__card">
              <header className="section2__card-head">
                <span className="section2__avatar" aria-hidden="true">M</span>
                <span className="section2__meta">
                  <span className="section2__name">M</span>
                  <time className="section2__time" dateTime="PT8M">8 min</time>
                </span>
              </header>
              <p className="section2__text" dir="auto">3andi 50 commandes lyoum. Ana w lemra nconfirmiw kima les robots, ndirou les appels من 9h ل 22h. Khedma khouya.</p>
              <footer className="section2__foot">
                <span className="section2__act"><HeartIcon />28</span>
                <span className="section2__act"><ReplyIcon />7</span>
              </footer>
            </article>
            <article className="section2__card">
              <header className="section2__card-head">
                <span className="section2__avatar" aria-hidden="true">S</span>
                <span className="section2__meta">
                  <span className="section2__name">S</span>
                  <time className="section2__time" dateTime="PT23M">23 min</time>
                </span>
              </header>
              <p className="section2__text" dir="auto">Le client il m&rsquo;a juré qu&rsquo;il sera là. Livreur arrive, personne. 1200 DA de perdus. Encore. Cette semaine c&rsquo;est la 4ème.</p>
              <footer className="section2__foot">
                <span className="section2__act"><HeartIcon />19</span>
                <span className="section2__act"><ReplyIcon />5</span>
              </footer>
            </article>
            <article className="section2__card">
              <header className="section2__card-head">
                <span className="section2__avatar" aria-hidden="true">K</span>
                <span className="section2__meta">
                  <span className="section2__name">K</span>
                  <time className="section2__time" dateTime="PT1H">1 h</time>
                </span>
              </header>
              <p className="section2__text" dir="auto">Localisation ki tab3atha la cliente = ma kanetch. Livreur ydour 30 min, y3ayet walou. كل مرة نفس الشي.</p>
              <footer className="section2__foot">
                <span className="section2__act"><HeartIcon />14</span>
                <span className="section2__act"><ReplyIcon />2</span>
              </footer>
            </article>
            <article className="section2__card">
              <header className="section2__card-head">
                <span className="section2__avatar" aria-hidden="true">R</span>
                <span className="section2__meta">
                  <span className="section2__name">R</span>
                  <time className="section2__time" dateTime="PT35M">35 min</time>
                </span>
              </header>
              <p className="section2__text" dir="auto">Livreur 3andou 4 commandes b 4800 DA. Ddpuis hier. Téléphone bel code. Wach ndir doka ?</p>
              <footer className="section2__foot">
                <span className="section2__act"><HeartIcon />9</span>
                <span className="section2__act"><ReplyIcon />4</span>
              </footer>
            </article>
            <article className="section2__card">
              <header className="section2__card-head">
                <span className="section2__avatar" aria-hidden="true">D</span>
                <span className="section2__meta">
                  <span className="section2__name">D</span>
                  <time className="section2__time" dateTime="PT1H">1 h</time>
                </span>
              </header>
              <p className="section2__text" dir="auto">4M500 en Ads ce mois. 60% retournés à la livraison.</p>
              <footer className="section2__foot">
                <span className="section2__act"><HeartIcon />31</span>
                <span className="section2__act"><ReplyIcon />8</span>
              </footer>
            </article>
          </div>
          <p className="section2__punch">Ce chaos, <span className="section2__brand">LIVRA</span> l&rsquo;a résolu.</p>
        </div>
      </section>
      <div className="lp-seam"></div>
    </>
  );
}
