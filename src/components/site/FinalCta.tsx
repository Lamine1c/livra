import styles from './FinalCta.module.css';

/* FinalCta — porté depuis la maquette HTML validée.
   Composant serveur : aucune interactivité JS (animations en CSS, FAQ en <details> natif).
   Police Inter via next/font ; tokens couleur via globals.css. */
export default function FinalCta() {
  return (
    <section className={styles['s9']} data-screen-label="Section 9 — CTA Final">
        <div className={styles['s9-inner']}>
          <p className={styles['s9-eyebrow']}><span className={styles['s9-pip']}></span>Prêt&nbsp;?</p>
          <h2 className={styles['s9-h2']}>Prêt à être un vrai professionnel&nbsp;?</h2>
          <p className={styles['s9-sub']}>Rejoignez les vendeurs DZ qui ont quitté la jungle.</p>
          <a className={styles['s9-cta']} href="#">
            Commencer gratuitement
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
          </a>
          <p className={styles['s9-assure']}>Aucun contrat.<span className={styles['sep']}>·</span>Annulation en 1 clic.</p>
        </div>
      </section>
  );
}
