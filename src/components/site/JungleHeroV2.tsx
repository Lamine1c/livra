import Link from "next/link";
import styles from "./JungleHeroV2.module.css";
import { gutterTopCards, gutterBottomCards, ghostCards, type CardData } from "./messages";

type HeroCSSVars = React.CSSProperties & { "--av"?: string };

function Card({ card }: { card: CardData }) {
  const s = styles as Record<string, string>;
  return (
    <div className={`${styles.card} ${s[card.cls]}`}>
      <div className={styles.cHead}>
        <span
          className={styles.cAv}
          style={{ "--av": card.av } as HeroCSSVars}
        >
          {card.initial}
        </span>
        <span className={styles.cName}>{card.name}</span>
      </div>
      <p className={styles.cText}>{card.text}</p>
      <span className={styles.cTime}>{card.time}</span>
    </div>
  );
}

export default function JungleHeroV2() {
  return (
    <section className={styles.hero}>

      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>LIVRA</Link>
        <div className={styles.navLinks}>
          <a href="#">Produit</a>
          <a href="#">Tarifs</a>
          <a href="#">Wilayas</a>
          <Link href="/auth/login" className={styles.navLogin}>Se connecter</Link>
        </div>
        <div className={styles.navBurger} aria-label="Menu">
          <span /><span /><span />
        </div>
      </nav>

      <div className={styles.stage}>

        {/* Ghost atmosphere — deep background, faint + blurred, slow float */}
        <div className={styles.ghosts} aria-hidden="true">
          {ghostCards.map((card) => (
            <Card key={card.cls} card={card} />
          ))}
        </div>

        {/* Sharp periphery cards — strictly outside the safe corridor */}
        <div className={styles.gutter} aria-hidden="true">
          <div className={`${styles.rail} ${styles.railTop}`}>
            {gutterTopCards.map((card) => (
              <Card key={card.cls} card={card} />
            ))}
          </div>
          <div className={`${styles.rail} ${styles.railBottom}`}>
            {gutterBottomCards.map((card) => (
              <Card key={card.cls} card={card} />
            ))}
          </div>
        </div>

        {/* Core — the protected centre */}
        <div className={styles.core}>
          <p className={styles.kicker}>
            <span className={styles.pip} />
            L&apos;OS de votre e-commerce
          </p>
          <h1 className={styles.h1}>
            <span className={styles.hl1}>Sortez de la</span>
            <span className={styles.hl2}>jungle.</span>
          </h1>
          <p className={styles.subtitle}>
            <strong>Commandes en auto, confirmations, Tracking Uber style, Suivi COD.</strong>{" "}
            Une seule app pour tout piloter.
          </p>
          <div className={styles.cta}>
            <Link href="#waitlist" className={styles.btn}>
              Commencer gratuitement
            </Link>
          </div>
          <p className={styles.micro}>
            Rejoignez les vendeurs qui ont quitté la jungle.
          </p>
        </div>

      </div>

      {/* Scroll hint */}
      <div className={styles.scrollHint} aria-hidden="true">
        <span className={styles.line} />
        Découvrir
      </div>
    </section>
  );
}
