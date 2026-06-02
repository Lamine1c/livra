import styles from './Philosophy.module.css';

/* Philosophy — porté depuis la maquette HTML validée.
   Composant serveur : aucune interactivité JS (animations en CSS, FAQ en <details> natif).
   Police Inter via next/font ; tokens couleur via globals.css. */
export default function Philosophy() {
  return (
    <section className={styles['s75']} data-screen-label="Section 7.5 — Notre philosophie">
        <div className={styles['s75-inner']}>

          <p className={styles['s75-eyebrow']}><span className={styles['s75-pip']}></span>Notre philosophie</p>

          <h2 className={styles['s75-statement']}>
            On n'a pas créé LIVRA pour livrer des colis.<br className={styles['brk']} />
            <span className={styles['dim']}>On l'a créé pour</span> <em>rendre leur métier</em> <span className={styles['dim']}>aux vendeurs algériens.</span>
          </h2>

          <p className={styles['s75-body']}>
            Pendant des années, vendre en ligne en Algérie voulait dire encaisser les coups&nbsp;:
            fausses commandes, colis perdus, clients fantômes, livreurs injoignables.
            <strong>On a décidé que ça suffisait.</strong> Pas avec une promesse — avec des outils.
          </p>

          <hr className={styles['s75-rule']} />

          <div className={styles['s75-credo']}>
            <div className={styles['s75-tenet']}>
              <span className={styles['no']}>01</span>
              <p className={styles['t']}>La confiance n'est pas une option.</p>
              <p className={styles['d']}>C'est le produit. Chaque fonction de LIVRA existe pour qu'un vendeur et son client se fassent confiance — preuve à l'appui.</p>
            </div>
            <div className={styles['s75-tenet']}>
              <span className={styles['no']}>02</span>
              <p className={styles['t']}>Un travail sérieux mérite des outils sérieux.</p>
              <p className={styles['d']}>Pas un bricolage de tableurs et de captures d'écran. Des outils qui tiennent, à la hauteur de votre ambition.</p>
            </div>
            <div className={styles['s75-tenet']}>
              <span className={styles['no']}>03</span>
              <p className={styles['t']}>La technologie doit parler votre langue.</p>
              <p className={styles['d']}>Pensée ici, pour le terrain d'ici. En darija comme en français — jamais l'inverse.</p>
            </div>
          </div>

          <p className={styles['s75-sign']}><span className={styles['em-dash']}>—</span>L'équipe <b>LIVRA</b>, Alger.</p>

        </div>
      </section>
  );
}
