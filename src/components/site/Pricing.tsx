import styles from './Pricing.module.css';

/* Pricing — porté depuis la maquette HTML validée.
   Composant serveur : aucune interactivité JS (animations en CSS, FAQ en <details> natif).
   Police Inter via next/font ; tokens couleur via globals.css. */
export default function Pricing() {
  return (
    <main className={styles['tf']} data-screen-label="Page Tarifs">

        {/* ── Top bar ── */}
        <nav className={styles['tf-nav']}>
          <a className={styles['tf-logo']} href="#">LIV<b>R</b>A</a>
          <a className={styles['tf-nav-link']} href="#">Connexion</a>
        </nav>

        {/* ── Hero ── */}
        <header className={styles['tf-hero']}>
          <p className={styles['tf-eyebrow']}><span className={styles['tf-pip']}></span>Tarifs LIVRA</p>
          <h1 className={styles['tf-h1']}>Un prix simple. <em>Aucun piège.</em></h1>
          <p className={styles['tf-hero-sub']}>
            Pas d'engagement. Pas de frais cachés.
            <strong>7 jours pour tester sans rien payer.</strong>
          </p>
        </header>

        {/* ── Pricing card ── */}
        <section className={styles['tf-stage']}>
          <div className={styles['tf-card']}>
            <span className={styles['tf-badge']}><span className={styles['d']}></span>Essai gratuit 7 jours</span>
            <div className={styles['tf-plan']}>LIVRA Starter</div>
            <div className={styles['tf-price']}>
              <span className={styles['amt']}>2 300</span>
              <span className={styles['per']}>DA / mois</span>
            </div>
            <p className={styles['tf-subprice']}>Annulation en 1 clic.</p>

            <div className={styles['tf-sep']}></div>

            <div className={styles['tf-feats']}>
              <div className={styles['tf-feat']}><span className={styles['chk']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span><strong>Commandes illimitées</strong></span></div>
              <div className={styles['tf-feat']}><span className={styles['chk']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>OTP WhatsApp anti-fausses commandes</span></div>
              <div className={styles['tf-feat']}><span className={styles['chk']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Pinpoint position GPS client</span></div>
              <div className={styles['tf-feat']}><span className={styles['chk']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Tracking livraison en direct</span></div>
              <div className={styles['tf-feat']}><span className={styles['chk']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>58 wilayas</span></div>
              <div className={styles['tf-feat']}><span className={styles['chk']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Support 24/7</span></div>
              <div className={styles['tf-feat']}><span className={styles['chk']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>Aucune carte requise pour l'essai</span></div>
            </div>

            <a className={styles['tf-cta']} href="#">
              Commencer mon essai gratuit
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
            </a>
            <p className={styles['tf-card-foot']}>7 jours gratuit · sans carte bancaire</p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={styles['tf-faq']}>
          <h2 className={styles['tf-faq-h']}>Questions fréquentes</h2>

          <details className={styles['tf-q']} open>
            <summary>Y a-t-il un engagement ?<span className={styles['ico']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></span></summary>
            <div className={styles['ans']}>Aucun. Vous pouvez annuler à tout moment en 1 clic, sans frais ni justification.</div>
          </details>

          <details className={styles['tf-q']}>
            <summary>Faut-il une carte bancaire pour l'essai ?<span className={styles['ico']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></span></summary>
            <div className={styles['ans']}>Non. 7 jours gratuits, sans aucune information de paiement. Vous ne renseignez vos coordonnées qu'au moment où vous décidez de continuer.</div>
          </details>

          <details className={styles['tf-q']}>
            <summary>Combien d'utilisateurs / livreurs puis-je avoir ?<span className={styles['ico']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></span></summary>
            <div className={styles['ans']}>Illimité. Tous vos livreurs peuvent rejoindre votre compte sans coût supplémentaire.</div>
          </details>

          <details className={styles['tf-q']}>
            <summary>Comment je paye après les 7 jours ?<span className={styles['ico']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></span></summary>
            <div className={styles['ans']}>Virement bancaire, Baridi Mob, ou cash à la poste. Une confirmation manuelle de votre paiement active votre compte.</div>
          </details>

          <details className={styles['tf-q']}>
            <summary>Et si je ne suis pas satisfait ?<span className={styles['ico']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></span></summary>
            <div className={styles['ans']}>Annulez en 1 clic. Aucun frais, aucun engagement, aucune question.</div>
          </details>

          <details className={styles['tf-q']}>
            <summary>Vous prenez aussi le marché hors Algérie ?<span className={styles['ico']}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></span></summary>
            <div className={styles['ans']}>Pour l'instant, l'Algérie uniquement. Le Maroc, la Tunisie et l'Égypte sont prévus pour 2027.</div>
          </details>
        </section>

        {/* ── Final CTA (mirror) ── */}
        <section className={styles['tf-final']} data-screen-label="Tarifs — CTA final">
          <div className={styles['tf-final-in']}>
            <h2>Prêt à être un vrai professionnel&nbsp;?</h2>
            <p>Rejoignez les vendeurs DZ qui ont quitté la jungle.</p>
            <a className={styles['tf-final-cta']} href="#">
              Commencer gratuitement
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
            </a>
            <p className={styles['tf-assure']}>Aucun contrat.<span className={styles['sep']}>·</span>Annulation en 1 clic.</p>
          </div>
        </section>

      </main>
  );
}
