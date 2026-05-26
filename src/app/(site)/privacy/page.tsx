import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Politique de confidentialité — LIVRA",
  description: "Comment LIVRA collecte, utilise et protège vos données personnelles.",
};

const sectionHeading: React.CSSProperties = {
  color: "var(--ivoire)",
  fontWeight: 600,
  fontSize: "1.25rem",
  marginTop: "3rem",
  marginBottom: "1rem",
};

const subHeading: React.CSSProperties = {
  color: "var(--ivoire)",
  fontWeight: 500,
  fontSize: "1rem",
  marginTop: "1.5rem",
  marginBottom: "0.5rem",
};

const bodyText: React.CSSProperties = {
  color: "var(--mist)",
  lineHeight: 1.75,
  fontSize: "1rem",
};

const listItem: React.CSSProperties = {
  color: "var(--mist)",
  lineHeight: 1.75,
  fontSize: "1rem",
  marginBottom: "0.375rem",
};

const hr: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.04)",
  marginTop: "2.5rem",
  marginBottom: "0",
};

const linkStyle: React.CSSProperties = {
  color: "var(--terracotta)",
  textDecoration: "none",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "6rem 1.5rem" }}>

          {/* Title */}
          <h1 style={{ color: "var(--ivoire)", fontSize: "2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Politique de confidentialité
          </h1>
          <p style={{ color: "var(--mist)", fontSize: "0.875rem", marginBottom: "3rem" }}>
            Dernière mise à jour&nbsp;: 26 mai 2026
          </p>

          {/* 1. Introduction */}
          <h2 style={sectionHeading}>1. Introduction</h2>
          <p style={bodyText}>
            LIVRA (exploité par 9516-1998 Québec Inc., Montréal, Canada) s&apos;engage à protéger
            la confidentialité de vos données personnelles. Cette politique explique quelles données
            nous collectons, pourquoi, et comment nous les traitons.
          </p>

          <hr style={hr} />

          {/* 2. Données collectées */}
          <h2 style={sectionHeading}>2. Données collectées</h2>
          <h3 style={subHeading}>Compte utilisateur</h3>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>Adresse e-mail, nom complet, numéro de téléphone WhatsApp</li>
            <li style={listItem}>Mot de passe (haché, jamais stocké en clair)</li>
          </ul>
          <h3 style={subHeading}>Données métier</h3>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>Commandes, clients, produits, adresses de livraison</li>
          </ul>
          <h3 style={subHeading}>Données Meta Lead Ads</h3>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>Leads Facebook importés via l&apos;API officielle Meta</li>
            <li style={listItem}>Pages Facebook connectées, tokens d&apos;accès (chiffrés au repos)</li>
          </ul>
          <h3 style={subHeading}>Données livreurs</h3>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              Position GPS collectée uniquement pendant les livraisons actives, purgée
              automatiquement après 30 jours
            </li>
          </ul>
          <h3 style={subHeading}>Données WhatsApp</h3>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              Numéros de téléphone utilisés pour l&apos;envoi d&apos;OTP et de notifications de livraison
            </li>
          </ul>

          <hr style={hr} />

          {/* 3. Finalités du traitement */}
          <h2 style={sectionHeading}>3. Finalités du traitement</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>Fourniture et amélioration du service LIVRA</li>
            <li style={listItem}>Authentification et sécurité des comptes</li>
            <li style={listItem}>Import automatique des leads publicitaires (Meta Lead Ads)</li>
            <li style={listItem}>Suivi GPS des livraisons en temps réel</li>
            <li style={listItem}>Envoi de notifications WhatsApp (OTP, statuts de livraison)</li>
            <li style={listItem}>
              Emails transactionnels (confirmation d&apos;inscription, réinitialisation de mot de passe)
            </li>
          </ul>

          <hr style={hr} />

          {/* 4. Sous-traitants et partage de données */}
          <h2 style={sectionHeading}>4. Sous-traitants et partage de données</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              <strong style={{ color: "var(--ivoire)", fontWeight: 500 }}>Supabase</strong>{" "}
              (PostgreSQL hébergé dans l&apos;UE, certifié SOC 2 Type II) — stockage principal
            </li>
            <li style={listItem}>
              <strong style={{ color: "var(--ivoire)", fontWeight: 500 }}>Vercel</strong>{" "}
              (hébergement web, serveurs en UE) — exécution de l&apos;application
            </li>
            <li style={listItem}>
              <strong style={{ color: "var(--ivoire)", fontWeight: 500 }}>Meta Platforms</strong>{" "}
              (lecture des leads via l&apos;API officielle Meta Lead Ads) — uniquement sur autorisation
              explicite du vendeur
            </li>
            <li style={listItem}>
              <strong style={{ color: "var(--ivoire)", fontWeight: 500 }}>Twilio</strong>{" "}
              (envoi de messages WhatsApp OTP et notifications) — numéros transmis uniquement pour
              l&apos;envoi
            </li>
            <li style={listItem}>
              <strong style={{ color: "var(--ivoire)", fontWeight: 500 }}>Resend</strong>{" "}
              (emails transactionnels) — adresses e-mail transmises uniquement pour l&apos;envoi
            </li>
          </ul>
          <p style={{ ...bodyText, marginTop: "1rem" }}>
            Nous ne vendons, louons ni partageons vos données personnelles avec des tiers à des
            fins commerciales.
          </p>

          <hr style={hr} />

          {/* 5. Durée de conservation */}
          <h2 style={sectionHeading}>5. Durée de conservation</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>Données de compte&nbsp;: jusqu&apos;à suppression du compte + 30 jours</li>
            <li style={listItem}>Données de commandes et clients&nbsp;: durée de vie du compte actif</li>
            <li style={listItem}>
              Positions GPS livreurs&nbsp;: 30 jours après la livraison, puis purge automatique
            </li>
            <li style={listItem}>Logs d&apos;authentification&nbsp;: 90 jours</li>
          </ul>

          <hr style={hr} />

          {/* 6. Suppression de vos données */}
          <h2 style={sectionHeading}>6. Suppression de vos données</h2>
          <p style={bodyText}>
            Pour demander la suppression de votre compte et de toutes les données associées, envoyez
            un email à{" "}
            <a href="mailto:hello@golivra.app" style={linkStyle} className="hover:underline">
              hello@golivra.app
            </a>{" "}
            avec l&apos;objet «&nbsp;Suppression de compte&nbsp;». Nous traitons les demandes dans
            un délai de 30 jours.
          </p>

          <hr style={hr} />

          {/* 7. Vos droits */}
          <h2 style={sectionHeading}>7. Vos droits</h2>
          <p style={bodyText}>
            Vous disposez des droits suivants&nbsp;: accès, rectification, suppression, portabilité,
            limitation du traitement, opposition. Pour exercer ces droits, contactez{" "}
            <a href="mailto:hello@golivra.app" style={linkStyle} className="hover:underline">
              hello@golivra.app
            </a>
            .
          </p>

          <hr style={hr} />

          {/* 8. Contact DPO */}
          <h2 style={sectionHeading}>8. Contact DPO</h2>
          <p style={bodyText}>
            Pour toute question relative à cette politique&nbsp;:{" "}
            <a href="mailto:hello@golivra.app" style={linkStyle} className="hover:underline">
              hello@golivra.app
            </a>{" "}
            (contact DPO provisoire — sera remplacé par{" "}
            <a href="mailto:privacy@golivra.app" style={linkStyle} className="hover:underline">
              privacy@golivra.app
            </a>
            ).
          </p>

          <hr style={hr} />

          {/* 9. Modifications */}
          <h2 style={sectionHeading}>9. Modifications</h2>
          <p style={bodyText}>
            Toute modification substantielle sera notifiée par email ou via l&apos;application au
            moins 15 jours avant entrée en vigueur.
          </p>

          <hr style={hr} />

          {/* 10. Juridiction */}
          <h2 style={sectionHeading}>10. Juridiction</h2>
          <p style={bodyText}>
            Cette politique est régie par les lois du Québec (Canada) pour les entités légales, et
            respecte le RGPD pour les utilisateurs résidant dans l&apos;Union européenne.
          </p>

        </article>
      </main>
      <Footer />
    </>
  );
}
