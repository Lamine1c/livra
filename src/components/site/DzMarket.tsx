import styles from './DzMarket.module.css';

/* DzMarket — porté depuis la maquette HTML validée.
   Composant serveur : aucune interactivité JS (animations en CSS, FAQ en <details> natif).
   Police Inter via next/font ; tokens couleur via globals.css. */
export default function DzMarket() {
  return (
    <section className={styles['s7']} data-screen-label="Section 7 — Conçu pour l'Algérie">
        <div className={styles['s7-inner']}>

          {/* ── Header ── */}
          <header className={styles['s7-header']}>
            <p className={styles['s7-eyebrow']}><span className={styles['s7-pip']}></span>Conçu pour l'Algérie</p>
            <h2 className={styles['s7-h2']}>Personne ne connaît votre marché comme nous.</h2>
            <p className={styles['s7-sub']}>
              LIVRA est pensé par et pour les e-commerçants algériens.
              <strong>58 wilayas couvertes. COD intégré nativement. Support en darija et en français.</strong>
              Hébergement et conformité pensés pour le marché DZ.
            </p>
          </header>

          {/* ── Cards ── */}
          <div className={styles['s7-cards']}>

            {/* 1 · 58 wilayas */}
            <article className={styles['s7-card']}>
              <span className={styles['s7-ic']}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
              </span>
              <div className={styles['s7-ctext']}>
                <h3 className={styles['s7-ctitle']}><span className={styles['num']}>58</span> wilayas couvertes</h3>
                <p className={styles['s7-cbody']}>Alger, Oran, Constantine, Annaba… et toutes les autres. Le réseau LIVRA s'étend à toute l'Algérie.</p>
              </div>
              <div className={styles['s7-tags']}>
                <span className={styles['s7-tag']}>Alger</span>
                <span className={styles['s7-tag']}>Oran</span>
                <span className={styles['s7-tag']}>Constantine</span>
                <span className={styles['s7-tag']}>Annaba</span>
                <span className={`${styles['s7-tag']} ${styles['more']}`}>+54</span>
              </div>
            </article>

            {/* 2 · COD natif */}
            <article className={styles['s7-card']}>
              <span className={styles['s7-ic']}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>
              </span>
              <div className={styles['s7-ctext']}>
                <h3 className={styles['s7-ctitle']}>COD natif</h3>
                <p className={styles['s7-cbody']}><strong>Cash on Delivery géré nativement.</strong> Pas de configuration bizarre. Le mode de paiement n°1 en Algérie, pris en charge par défaut.</p>
              </div>
            </article>

            {/* 3 · Support darija + français */}
            <article className={styles['s7-card']}>
              <span className={styles['s7-ic']}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 20l1-3.5A8.3 8.3 0 0 1 3 12 8.5 8.5 0 0 1 11.5 3.5 8.4 8.4 0 0 1 21 11.5z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>
              </span>
              <div className={styles['s7-ctext']}>
                <h3 className={styles['s7-ctitle']}>Support en darija <span style={{ color: 'var(--s7-mist-dim)', fontWeight: '600' }}>+</span> français</h3>
                <p className={styles['s7-cbody']}>Pas de support en anglais avec traducteur Google. Une équipe qui parle votre langue, comprend vos clients, connaît votre quotidien.</p>
              </div>
            </article>

            {/* 4 · Données hébergées DZ */}
            <article className={styles['s7-card']}>
              <span className={styles['s7-ic']}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V5.5z"/><path d="M9 12l2 2 4-4"/></svg>
              </span>
              <div className={styles['s7-ctext']}>
                <h3 className={styles['s7-ctitle']}>Données hébergées pour le marché DZ</h3>
                <p className={styles['s7-cbody']}>Conformité, sécurité et infrastructure pensées pour le contexte algérien. Vos données, votre business, votre marché.</p>
              </div>
            </article>

          </div>

          {/* ── CTA ── */}
          <div className={styles['s7-cta-wrap']}>
            <a className={styles['s7-cta-btn']} href="#">Devenez un vrai professionnel</a>
            <p className={styles['s7-cta-sub']}>7 jours gratuit. Aucun contrat.</p>
          </div>

        </div>
      </section>
  );
}
