// ────────────────────────────────────────────────────────────────
// Philosophy.tsx — Section 7.5 · Notre philosophie
// Manifeste (chapitre calme) + 4 preuves concrètes (fusion DzMarket).
//
// • Remplace l'ancienne paire Philosophy + DzMarket : supprimer l'import
//   et le rendu de <DzMarket /> côté page, cette section les absorbe.
// • Tokens couleur depuis globals.css ; police Inter via next/font.
// • Icônes = line-icons SVG inline (système « Ombre sur glace »), pas d'emoji.
// ────────────────────────────────────────────────────────────────
import styles from './Philosophy.module.css';
import SectionCta from './SectionCta';

const WILAYAS = ['Alger', 'Oran', 'Constantine', 'Annaba'] as const;

const TENETS = [
  {
    n: '01',
    title: "La confiance n'est pas une option.",
    text: "C'est le produit. Chaque fonction de LIVRA existe pour qu'un vendeur et son client se fassent confiance — preuve à l'appui.",
  },
  {
    n: '02',
    title: 'Un travail sérieux mérite des outils sérieux.',
    text: "Pas un bricolage de tableurs et de captures d'écran. Des outils qui tiennent, à la hauteur de votre ambition.",
  },
  {
    n: '03',
    title: 'La technologie doit parler votre langue.',
    text: "Pensée ici, pour le terrain d'ici. En darija comme en français — jamais l'inverse.",
  },
];

type Card = {
  icon: React.ReactNode;
  title: React.ReactNode;
  body: string;
  tags?: boolean;
};

/* ── Line-icons (24×24, stroke currentColor) ── */
const PinIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);
const CashIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v5M18 9.5v5" />
  </svg>
);
const ChatIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 20l1-3.5A8.3 8.3 0 0 1 3 12 8.5 8.5 0 0 1 11.5 3.5 8.4 8.4 0 0 1 21 11.5z" />
    <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
  </svg>
);
const ShieldIcon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V5.5z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const CARDS: Card[] = [
  {
    icon: PinIcon,
    title: <><span className={styles.num}>58</span> wilayas couvertes</>,
    body: "Alger, Oran, Constantine, Annaba… et toutes les autres. Le réseau LIVRA s'étend à toute l'Algérie.",
    tags: true,
  },
  {
    icon: CashIcon,
    title: 'Trésorerie Blindée',
    body: "Votre argent tracé au centime près. Suivez votre cash total et le montant exact détenu par chaque livreur, en un coup d'œil.",
  },
  {
    icon: ChatIcon,
    title: 'Support 24/7',
    body: "Pensé ici, pour le e-commerce d'ici. Un support ultra-réactif qui comprend vos réalités.",
  },
  {
    icon: ShieldIcon,
    title: 'Sécurité Maximale',
    body: 'Vos données business sont chiffrées et protégées par une infrastructure aux normes de sécurité les plus strictes.',
  },
];

export default function Philosophy() {
  return (
    <>
    <section className={styles.section} data-screen-label="Section 7.5 — Notre philosophie">
      <div className={styles.inner}>

        <p className={styles.eyebrow}><span className={styles.pip} />Notre philosophie</p>

        <h2 className={styles.statement}>
          On n&rsquo;est pas obsédés par ce que font les autres.
          On est obsédés par ce dont <em>nos clients ont besoin</em>.
          C&rsquo;est de là qu&rsquo;on part.
        </h2>

        <p className={styles.body}>
          Pendant des années, vendre en ligne en Algérie voulait dire encaisser les coups&nbsp;:
          fausses commandes, colis perdus, clients fantômes, livreurs injoignables.{' '}
          <strong>On a dit STOP&nbsp;!!</strong><br />Pas avec une promesse — avec des outils.
        </p>

        <hr className={styles.rule} />

        <div className={styles.credo}>
          {TENETS.map((t) => (
            <div className={styles.tenet} key={t.n}>
              <span className={styles.tenetNo}>{t.n}</span>
              <p className={styles.tenetTitle}>{t.title}</p>
              <p className={styles.tenetText}>{t.text}</p>
            </div>
          ))}
        </div>

        <hr className={styles.rule} />

        <div className={styles.cards}>
          {CARDS.map((card, i) => (
            <article className={styles.card} key={i}>
              <span className={styles.ic}>{card.icon}</span>
              <div className={styles.ctext}>
                <h3 className={styles.ctitle}>{card.title}</h3>
                <p className={styles.cbody}>{card.body}</p>
              </div>
              {card.tags && (
                <div className={styles.tags}>
                  {WILAYAS.map((w) => (
                    <span className={styles.tag} key={w}>{w}</span>
                  ))}
                  <span className={`${styles.tag} ${styles.more}`}>+54</span>
                </div>
              )}
            </article>
          ))}
        </div>

        <hr className={styles.rule} />

        <p className={styles.sign}>
          <span className={styles.emDash}>—</span>L&rsquo;équipe <b>LIVRA</b>, Alger.
        </p>

      </div>
    </section>
    <SectionCta
      label="Devenez un vrai professionnel"
      subtext="7 jours gratuit. Aucun contrat."
    />
    </>
  );
}
