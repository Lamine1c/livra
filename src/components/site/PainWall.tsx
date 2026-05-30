import styles from './PainWall.module.css';

const HeartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const ReplyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 17l-5-5 5-5" /><path d="M4 12h11a5 5 0 0 1 5 5v2" />
  </svg>
);

export default function PainWall() {
  return (
    <section className={styles.section2}>
      <div className={styles.inner}>

        {/* ── Header ── */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <span className={styles.pip} />
            Le quotidien actuel
          </p>
          <h2 className={styles.h2}>Pendant ce temps, sur Facebook…</h2>
          <p className={styles.subtitle}>
            Des milliers de vendeurs perdent du temps, de l&apos;argent, et des clients.
          </p>
        </header>

        {/* ── Mur de commentaires ── */}
        <div className={styles.cards}>

          {/* Card 1 — Y · 4 min — 100% arabe RTL */}
          <article className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">Y</span>
              <span className={styles.meta}>
                <span className={styles.name}>Y</span>
                <time className={styles.time} dateTime="PT4M">4 min</time>
              </span>
            </header>
            <p className={`${styles.text} ${styles.textRtl}`} dir="rtl" lang="ar">
              ما يشقوش رواحهم و يعيطولك، يبعثولك مساج SMS. كاين بزاف ناس كيما حالتي ما يقراوش SMS نهار، و يرجعوهم retour. صراتلي شحال من مرة، نعود نحلف للبائع ولله ما عيطولي.
            </p>
            <footer className={styles.foot}>
              <span className={styles.act}><HeartIcon />12</span>
              <span className={styles.act}><ReplyIcon />3</span>
            </footer>
          </article>

          {/* Card 2 — M · 8 min — arabizi + FR + arabe inline */}
          <article className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">M</span>
              <span className={styles.meta}>
                <span className={styles.name}>M</span>
                <time className={styles.time} dateTime="PT8M">8 min</time>
              </span>
            </header>
            <p className={styles.text} dir="auto">
              3andi 50 commandes lyoum. Ana w lemra nconfirmiw kima les robots, ndirou les appels من 9h ل 22h. Khedma khouya.
            </p>
            <footer className={styles.foot}>
              <span className={styles.act}><HeartIcon />28</span>
              <span className={styles.act}><ReplyIcon />7</span>
            </footer>
          </article>

          {/* Card 3 — S · 23 min — français DZ */}
          <article className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">S</span>
              <span className={styles.meta}>
                <span className={styles.name}>S</span>
                <time className={styles.time} dateTime="PT23M">23 min</time>
              </span>
            </header>
            <p className={styles.text} dir="auto">
              Le client il m&apos;a juré qu&apos;il sera là. Livreur arrive, personne. 1200 DA de perdus. Encore. Cette semaine c&apos;est la 4ème.
            </p>
            <footer className={styles.foot}>
              <span className={styles.act}><HeartIcon />19</span>
              <span className={styles.act}><ReplyIcon />5</span>
            </footer>
          </article>

          {/* Card 4 — K · 1 h — arabizi + arabe inline */}
          <article className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">K</span>
              <span className={styles.meta}>
                <span className={styles.name}>K</span>
                <time className={styles.time} dateTime="PT1H">1 h</time>
              </span>
            </header>
            <p className={styles.text} dir="auto">
              Localisation ki tab3atha la cliente = ma kanetch. Livreur ydour 30 min, y3ayet walou. كل مرة نفس الشي.
            </p>
            <footer className={styles.foot}>
              <span className={styles.act}><HeartIcon />14</span>
              <span className={styles.act}><ReplyIcon />2</span>
            </footer>
          </article>

          {/* Card 5 — R · 35 min — arabizi + FR */}
          <article className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">R</span>
              <span className={styles.meta}>
                <span className={styles.name}>R</span>
                <time className={styles.time} dateTime="PT35M">35 min</time>
              </span>
            </header>
            <p className={styles.text} dir="auto">
              Livreur 3andou 4 commandes b 4800 DA. Ddpuis hier. Téléphone bel code. Wach ndir doka&nbsp;?
            </p>
            <footer className={styles.foot}>
              <span className={styles.act}><HeartIcon />9</span>
              <span className={styles.act}><ReplyIcon />4</span>
            </footer>
          </article>

          {/* Card 6 — D · 1 h — français DZ */}
          <article className={styles.card}>
            <header className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">D</span>
              <span className={styles.meta}>
                <span className={styles.name}>D</span>
                <time className={styles.time} dateTime="PT1H">1 h</time>
              </span>
            </header>
            <p className={styles.text} dir="auto">
              4M500 en Ads ce mois. 60% retournés à la livraison.
            </p>
            <footer className={styles.foot}>
              <span className={styles.act}><HeartIcon />31</span>
              <span className={styles.act}><ReplyIcon />8</span>
            </footer>
          </article>

        </div>

        {/* ── Punchline ── */}
        <p className={styles.punch}>
          Ce chaos, <span className={styles.brand}>LIVRA</span> l&apos;a résolu.
        </p>

      </div>
    </section>
  );
}
