// ────────────────────────────────────────────────────────────────
// PourquoiLivra.tsx — Section « Pourquoi LIVRA ? » · v2 polish
// Manifeste narratif (chapitre calme) entre JungleHeroV2 et ProductDemo.
//
// v2 : body left-align (colonne 640px), 1er paragraphe lead + drop-cap
//   terracotta, 4 mots-clés en <strong class=key> terracotta, punchline
//   « Alors on a arrêté… » en palier (italique + 56px). Contenu inchangé.
//
// • Respiration entre le Hero visuel chargé et la démo produit.
//   Zéro mockup, 100% typographie. Fond --noir-deep (un cran sous
//   l'--onyx du Hero) pour marquer la pause narrative.
// • Tokens couleur depuis globals.css ; police Inter via next/font.
// • Scroll-in : fade + translateY 12→0 (300ms ease-out), une seule
//   fois, via IntersectionObserver. Respecte prefers-reduced-motion.
// ────────────────────────────────────────────────────────────────
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PourquoiLivra.module.css';

export default function PourquoiLivra() {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 },
    );
    io.observe(el);

    // Si déjà dans le viewport au montage → révéler tout de suite.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) setInView(true);

    // Filet de sécurité : garantit la visibilité si l'IO ne se déclenche
    // jamais (rendu offscreen / non composité). N'altère pas l'effet sinon.
    const t = window.setTimeout(() => setInView(true), 600);

    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`${styles.section} ${inView ? styles.isIn : ''}`}
      data-screen-label="Pourquoi LIVRA ?"
    >
      <div className={styles.inner}>

        <p className={`${styles.eyebrow} ${styles.anim}`}>
          <span className={styles.pip} />Pourquoi LIVRA&nbsp;?</p>

        <h2 className={`${styles.title} ${styles.anim}`}>
          On a saigné. On a vécu.
        </h2>

        <div className={`${styles.body} ${styles.anim}`}>
          <p className={styles.lead}>On vient exactement de là où tu es aujourd&rsquo;hui.</p>
          <p>On a connu les <strong className={styles.key}>nuits blanches</strong> sur des fichiers Excel qui crashent, à essayer de reconstituer la journée&nbsp;: qui a payé, qui a annulé après que le livreur a déjà fait la route, qui a remboursé un produit défectueux.</p>
          <p>Tout ça dans la tête, sur des bouts de papier, dans un cahier griffonné, sans jamais savoir au centime près ce qui nous revient.</p>
          <p>On a bouffé la frustration des <strong className={styles.key}>confirmatrices</strong>&nbsp;: un jour elles te sortent un taux de validation de feu, le lendemain elles dorment sur les leads et te bousillent tes pubs Meta.</p>
          <p>On a perdu des matins entiers au téléphone à supplier des <strong className={styles.key}>acheteurs fantômes</strong> qui ne répondent plus au moment de livrer, pour finir par se prendre des retours qui bouffent le bénéfice de trois ventes d&rsquo;un coup.</p>
          <p>On a vu des colis s&rsquo;évaporer dans des centres de tri sans laisser de trace.</p>
          <p>On a vu des livreurs décider tout seuls de pas appeler ton client parce qu&rsquo;ils ont la flemme de monter les étages.</p>
          <p>On a regardé Shopify, Sellsy et les logiciels occidentaux. Aucun n&rsquo;est taillé pour le terrain d&rsquo;ici. Ils ne connaissent ni nos galères de transport, ni <strong className={styles.key}>la paranoïa du Cash on Delivery</strong>.</p>
          <p className={styles.turn}>Alors on a arrêté de chercher un sauveur.</p>
          <p>On a ouvert nos PC et on a construit LIVRA. Pas dans un bureau climatisé, mais pour sortir notre propre business de la jungle.</p>
        </div>

        <hr className={`${styles.rule} ${styles.anim}`} />

        <p className={`${styles.sign} ${styles.anim}`}>
          <span className={styles.flag}>🇩🇿</span>Fait en Algérie. Pour le e-commerce DZ.
        </p>

      </div>
    </section>
  );
}
