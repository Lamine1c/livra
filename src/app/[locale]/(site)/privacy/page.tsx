import type { Metadata } from "next";
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

const metaText: React.CSSProperties = {
  color: "var(--mist)",
  fontSize: "0.875rem",
  lineHeight: 1.6,
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

const sectionBody: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.85rem",
};

const subList: React.CSSProperties = {
  paddingLeft: "1.25rem",
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.375rem",
};

export default function PrivacyPage() {
  return (
    <>
      <main>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "6rem 1.5rem" }}>

          {/* Title */}
          <h1 style={{ color: "var(--ivoire)", fontSize: "2rem", fontWeight: 600, marginBottom: "1rem" }}>
            Politique de confidentialité
          </h1>
          <p style={{ ...metaText, marginBottom: "0.25rem" }}>Version&nbsp;: v2-2026-06-17</p>
          <p style={{ ...metaText, marginBottom: "2.5rem" }}>Dernière mise à jour&nbsp;: 17 juin 2026</p>

          {/* 1. INTRODUCTION */}
          <h2 style={sectionHeading}>1. INTRODUCTION</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"LIVRA, exploité par 9516-1998 Québec inc. (Montréal, Québec, Canada), s'engage à protéger la confidentialité des données personnelles de ses utilisateurs. La présente politique explique quelles données sont collectées, à quelles fins, et comment elles sont traitées."}</p>
          </div>

          <hr style={hr} />

          {/* 2. DONNÉES COLLECTÉES */}
          <h2 style={sectionHeading}>2. DONNÉES COLLECTÉES</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"2.1. Données de compte Vendeur :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"Adresse email, nom complet, numéro de téléphone WhatsApp"}</li>
              <li style={listItem}>{"Mot de passe (haché par algorithme bcrypt, jamais stocké en clair)"}</li>
              <li style={listItem}>{"Nom commercial de la boutique"}</li>
            </ul>
            <p style={bodyText}>{"2.2. Données métier du Vendeur :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"Commandes, produits, données clients (Acheteurs) saisies par le Vendeur"}</li>
              <li style={listItem}>{"Adresses de livraison"}</li>
            </ul>
            <p style={bodyText}>{"2.3. Données Acheteur (collectées avec son consentement implicite via le partage WhatsApp ou explicite via la page de tracking publique) :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"Numéro de téléphone (pour l'envoi de notifications de livraison)"}</li>
              <li style={listItem}>{"Coordonnées GPS partagées volontairement (uniquement si l'Acheteur active cette fonctionnalité depuis WhatsApp pour faciliter sa livraison)"}</li>
            </ul>
            <p style={bodyText}>{"2.4. Données Livreur :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"Numéro de téléphone, nom"}</li>
              <li style={listItem}>{"Position GPS collectée UNIQUEMENT pendant les livraisons actives, purgée automatiquement 30 jours après la livraison"}</li>
            </ul>
            <p style={bodyText}>{"2.5. Données système :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"Signaux observés par le Service (confirmations OTP, livraisons réussies/refusées, comportements suspects)"}</li>
              <li style={listItem}>{"Logs d'authentification et logs techniques"}</li>
            </ul>
            <p style={bodyText}>{"2.6. Données d'acceptation contractuelle :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"Horodatage UTC de l'acceptation des CGU et de la Politique de confidentialité"}</li>
              <li style={listItem}>{"Adresse IP au moment de l'acceptation"}</li>
              <li style={listItem}>{"Identifiant technique du navigateur (user-agent)"}</li>
              <li style={listItem}>{"Versions des documents acceptés"}</li>
            </ul>
            <p style={bodyText}>{"Ces données sont conservées 5 ans après résiliation du compte à titre de preuve légale opposable au Vendeur."}</p>
          </div>

          <hr style={hr} />

          {/* 3. FINALITÉS DU TRAITEMENT */}
          <h2 style={sectionHeading}>3. FINALITÉS DU TRAITEMENT</h2>
          <div style={sectionBody}>
            <ul style={subList}>
              <li style={listItem}>{"Fourniture du Service LIVRA et amélioration continue"}</li>
              <li style={listItem}>{"Authentification et sécurité des comptes"}</li>
              <li style={listItem}>{"Suivi GPS des livraisons en temps réel"}</li>
              <li style={listItem}>{"Envoi de notifications WhatsApp (OTP, statuts de livraison, confirmations)"}</li>
              <li style={listItem}>{"Envoi d'emails transactionnels (confirmation d'inscription, réinitialisation de mot de passe, alertes de service)"}</li>
              <li style={listItem}>{"Prévention de la fraude (détection des comportements abusifs, anti-scam)"}</li>
              <li style={listItem}>{"Établissement de la preuve d'acceptation contractuelle"}</li>
              <li style={listItem}>{"Statistiques agrégées et anonymisées d'amélioration du Service"}</li>
            </ul>
          </div>

          <hr style={hr} />

          {/* 4. SOUS-TRAITANTS ET PARTAGE DE DONNÉES */}
          <h2 style={sectionHeading}>4. SOUS-TRAITANTS ET PARTAGE DE DONNÉES</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"LIVRA s'appuie sur les sous-traitants techniques suivants, sélectionnés pour leur conformité aux standards de sécurité internationaux :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"Supabase (PostgreSQL hébergé en Union Européenne, certifié SOC 2 Type II) — stockage principal des données"}</li>
              <li style={listItem}>{"Vercel (hébergement de l'application web, serveurs en Union Européenne) — exécution de l'application"}</li>
              <li style={listItem}>{"Twilio (envoi de messages WhatsApp OTP et notifications) — numéros de téléphone transmis exclusivement pour l'envoi"}</li>
              <li style={listItem}>{"Resend (envoi d'emails transactionnels) — adresses email transmises exclusivement pour l'envoi"}</li>
            </ul>
            <p style={bodyText}>{"LIVRA ne vend, ne loue ni ne partage les données personnelles avec des tiers à des fins commerciales ou publicitaires."}</p>
          </div>

          <hr style={hr} />

          {/* 5. DONNÉES AGRÉGÉES ET ANONYMISÉES */}
          <h2 style={sectionHeading}>5. DONNÉES AGRÉGÉES ET ANONYMISÉES</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"5.1. LIVRA peut exploiter les signaux système collectés (article 2.5) sous forme strictement anonymisée et/ou agrégée à des fins :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"d'amélioration du Service ;"}</li>
              <li style={listItem}>{"de prévention de la fraude au bénéfice de la communauté des Vendeurs ;"}</li>
              <li style={listItem}>{"de développement de nouvelles fonctionnalités, notamment un registry collectif de signaux de fraude."}</li>
            </ul>
            <p style={bodyText}>{"5.2. Aucune donnée nominative permettant d'identifier un Acheteur individuel ne sera exploitée dans ce cadre sans son consentement exprès."}</p>
          </div>

          <hr style={hr} />

          {/* 6. DURÉE DE CONSERVATION */}
          <h2 style={sectionHeading}>6. DURÉE DE CONSERVATION</h2>
          <div style={sectionBody}>
            <ul style={subList}>
              <li style={listItem}>{"Données de compte Vendeur : durée de vie du compte + 30 jours après résiliation"}</li>
              <li style={listItem}>{"Données métier (commandes, clients) : durée de vie du compte"}</li>
              <li style={listItem}>{"Positions GPS des Livreurs : 30 jours après la livraison, puis purge automatique"}</li>
              <li style={listItem}>{"Logs d'authentification : 90 jours"}</li>
              <li style={listItem}>{"Données d'acceptation contractuelle : 5 ans après résiliation du compte"}</li>
              <li style={listItem}>{"Données système anonymisées : conservation indéfinie sous forme non identifiante"}</li>
            </ul>
          </div>

          <hr style={hr} />

          {/* 7. RESPONSABILITÉ DU VENDEUR VIS-À-VIS DES ACHETEURS */}
          <h2 style={sectionHeading}>7. RESPONSABILITÉ DU VENDEUR VIS-À-VIS DES ACHETEURS</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"Le Vendeur est seul responsable, vis-à-vis de ses propres Acheteurs, du respect de la législation applicable en matière de protection des données personnelles (information préalable, consentement, droits des personnes, etc.). LIVRA met à disposition les outils techniques mais n'est pas le responsable de traitement pour les données des Acheteurs collectées et utilisées par le Vendeur dans le cadre de sa propre activité commerciale."}</p>
          </div>

          <hr style={hr} />

          {/* 8. SUPPRESSION DE COMPTE ET DROITS DE L'UTILISATEUR */}
          <h2 style={sectionHeading}>8. SUPPRESSION DE COMPTE ET DROITS DE L&apos;UTILISATEUR</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"8.1. Le Vendeur dispose des droits suivants concernant ses données personnelles : droit d'accès, droit de rectification, droit de suppression, droit à la portabilité, droit à la limitation du traitement, droit d'opposition."}</p>
            <p style={bodyText}>
              {"8.2. Pour exercer ces droits ou demander la suppression de son compte, le Vendeur peut envoyer un email à "}
              <a href="mailto:hello@golivra.app" style={linkStyle} className="hover:underline">hello@golivra.app</a>
              {" avec l'objet « Droits données personnelles » ou « Suppression de compte »."}
            </p>
            <p style={bodyText}>{"8.3. Les demandes sont traitées dans un délai maximum de 30 jours."}</p>
            <p style={bodyText}>{"8.4. Certaines données peuvent être conservées au-delà de la suppression du compte pour répondre à des obligations légales ou contractuelles (notamment la preuve d'acceptation contractuelle — article 2.6 — conservée 5 ans)."}</p>
          </div>

          <hr style={hr} />

          {/* 9. SÉCURITÉ DES DONNÉES */}
          <h2 style={sectionHeading}>9. SÉCURITÉ DES DONNÉES</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"LIVRA met en œuvre des mesures techniques et organisationnelles adaptées pour protéger les données contre l'accès non autorisé, la modification, la divulgation ou la destruction : chiffrement en transit (HTTPS/TLS), chiffrement au repos pour les données sensibles, authentification multi-facteurs sur les comptes administratifs, journalisation des accès."}</p>
          </div>

          <hr style={hr} />

          {/* 10. MODIFICATIONS DE LA PRÉSENTE POLITIQUE */}
          <h2 style={sectionHeading}>10. MODIFICATIONS DE LA PRÉSENTE POLITIQUE</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"Toute modification substantielle de la présente politique sera notifiée par email ou via l'application au moins 15 jours avant son entrée en vigueur. Une ré-acceptation expresse peut être requise."}</p>
          </div>

          <hr style={hr} />

          {/* 11. CONTACT */}
          <h2 style={sectionHeading}>11. CONTACT</h2>
          <div style={sectionBody}>
            <p style={bodyText}>
              {"Pour toute question relative à la présente politique : "}
              <a href="mailto:hello@golivra.app" style={linkStyle} className="hover:underline">hello@golivra.app</a>
            </p>
          </div>

        </article>
      </main>
      <Footer />
    </>
  );
}
