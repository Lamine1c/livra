'use client';

import styles from './JungleHero.module.css';

type CardStyle = React.CSSProperties & { [key: `--${string}`]: string };

export default function JungleHero() {
  return (
    <section className={styles.hero}>

      {/* 11 jungle cards (c12 Bilal Z. supprimée) */}
      <div className={styles.cards} aria-hidden="true">

        {/* c1 Karim B. — sharp, top-left */}
        <div className={`${styles.jcard} ${styles.c1} ${styles.tSharp}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#D97757' } as CardStyle}>K</span>
            <span className={styles.jcName}>Karim B.</span>
          </div>
          <p className={styles.jcText}>Sahbi wech rahi commande ta3i ? 3 ayyam w mazal walou 😤</p>
          <span className={styles.jcTime}>il y a 2h</span>
        </div>

        {/* c2 Amine S. — sharp, mid-left */}
        <div className={`${styles.jcard} ${styles.c2} ${styles.tSharp}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#3a6b54' } as CardStyle}>A</span>
            <span className={styles.jcName}>Amine S.</span>
          </div>
          <p className={styles.jcText}>Khouya rani l&apos;aman… 4 colis COD radjou, w l&apos;cahier ta3 commandes dssil fih lokhrin</p>
          <span className={styles.jcTime}>hier</span>
        </div>

        {/* c3 Yacine T. — sharp, top-right (repositionné bottom-right sur mobile) */}
        <div className={`${styles.jcard} ${styles.c3} ${styles.tSharp}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#D17861' } as CardStyle}>Y</span>
            <span className={styles.jcName}>Yacine T.</span>
          </div>
          <p className={styles.jcText}>30% retour hada machi business, hada massacre 💀</p>
          <span className={styles.jcTime}>il y a 3h</span>
        </div>

        {/* c4 Sami O. — sharp desktop / ghost mobile */}
        <div className={`${styles.jcard} ${styles.c4} ${styles.tSharp}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#9CA3AF' } as CardStyle}>S</span>
            <span className={styles.jcName}>Sami O.</span>
          </div>
          <p className={styles.jcText}>Krahna men colis en instance, w men « rappelez-moi demain »</p>
          <span className={styles.jcTime}>il y a 30 min</span>
        </div>

        {/* c5 Hocine R. — sharp, centre-left */}
        <div className={`${styles.jcard} ${styles.c5} ${styles.tSharp}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#9CA3AF' } as CardStyle}>H</span>
            <span className={styles.jcName}>Hocine R.</span>
          </div>
          <p className={styles.jcText}>Lead Meta b 2$ w yji ydir « just looking » 😭</p>
          <span className={styles.jcTime}>il y a 1h</span>
        </div>

        {/* c7 Ryad B. — ghost desktop / sharp mobile (derrière H1) */}
        <div className={`${styles.jcard} ${styles.c7} ${styles.tGhost}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#C9954D' } as CardStyle}>R</span>
            <span className={styles.jcName}>Ryad B.</span>
          </div>
          <p className={styles.jcText}>Confirmation par WA, par tel, par DM… w finalement client yqolik « machi ana »</p>
          <span className={styles.jcTime}>hier</span>
        </div>

        {/* c8 Mehdi L. — ghost, derrière zone CTA */}
        <div className={`${styles.jcard} ${styles.c8} ${styles.tGhost}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#3a6b54' } as CardStyle}>M</span>
            <span className={styles.jcName}>Mehdi L.</span>
          </div>
          <p className={styles.jcText}>Le livreur ma rd-ch l&apos;cash hier, w rani na3ref weh fin houwa</p>
          <span className={styles.jcTime}>il y a 4h</span>
        </div>

        {/* c9 Walid H. — sharp, bottom-left */}
        <div className={`${styles.jcard} ${styles.c9} ${styles.tSharp}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#D17861' } as CardStyle}>W</span>
            <span className={styles.jcName}>Walid H.</span>
          </div>
          <p className={styles.jcText}>Excel ta3 commandes f téléphone, screenshots f WA, w cahier f sac. Nakhdem wla nfantasme ?</p>
          <span className={styles.jcTime}>il y a 6h</span>
        </div>

        {/* c10 Nassim K. — semi, bottom-centre */}
        <div className={`${styles.jcard} ${styles.c10} ${styles.tSemi}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#9CA3AF' } as CardStyle}>N</span>
            <span className={styles.jcName}>Nassim K.</span>
          </div>
          <p className={styles.jcText}>H24 connecté sur Messenger, tgoul rani nakhdem f central téléphonique</p>
          <span className={styles.jcTime}>à l&apos;instant</span>
        </div>

        {/* c11 Anis F. — sharp, bottom-right */}
        <div className={`${styles.jcard} ${styles.c11} ${styles.tSharp}`}>
          <div className={styles.jcHead}>
            <span className={styles.jcAv} style={{ '--av': '#D97757' } as CardStyle}>A</span>
            <span className={styles.jcName}>Anis F.</span>
          </div>
          <p className={styles.jcText}>B&apos;sa7 9olbi yrouh quand ychouf « commande annulée » f 1ère ligne de la matinée 🥲</p>
          <span className={styles.jcTime}>il y a 7h</span>
        </div>

      </div>

      {/* Breach card — sibling de heroCore pour échapper au stacking context de .cards */}
      <div className={`${styles.jcard} ${styles.c6} ${styles.breach}`} aria-hidden="true">
        <div className={styles.jcHead}>
          <span className={styles.jcAv} style={{ '--av': '#C9954D' } as CardStyle}>S</span>
          <span className={styles.jcName}>Sofiane M.</span>
        </div>
        <p className={styles.jcText}>Wech ndir b had l&apos;colis ? Client ma yjaweb-ch.</p>
        <span className={styles.jcTime}>il y a 5h</span>
      </div>

      <div className={styles.heroCore}>
        <p className={styles.kicker}>
          <span className={styles.pip} />
          L&apos;OS de votre e-commerce
        </p>
        <h1>Sortez de la jungle.</h1>
        <div className={styles.cta}>
          <a href="#waitlist" className={styles.btn}>
            Commencer gratuitement
          </a>
        </div>
        <p className={styles.subtitle}>
          <strong>LIVRA est l&apos;OS de votre e-commerce.</strong> Commandes, confirmations,
          tournées et cash COD&nbsp;— réunis dans une seule application. Fini les cahiers,
          les captures d&apos;écran et les colis perdus.
        </p>
      </div>

      <div className={styles.scrollHint}>
        <span className={styles.line} />
        Découvrir
      </div>

    </section>
  );
}
