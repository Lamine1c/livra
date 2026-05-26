import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — LIVRA",
  description: "Conditions régissant l'utilisation du service LIVRA pour les e-commerçants.",
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

export default function CguPage() {
  return (
    <>
      <Header />
      <main>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "6rem 1.5rem" }}>

          {/* Title */}
          <h1 style={{ color: "var(--ivoire)", fontSize: "2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Conditions Générales d&apos;Utilisation
          </h1>
          <p style={{ color: "var(--mist)", fontSize: "0.875rem", marginBottom: "3rem" }}>
            Dernière mise à jour&nbsp;: 26 mai 2026
          </p>

          {/* 1. Définition du service */}
          <h2 style={sectionHeading}>1. Définition du service</h2>
          <p style={bodyText}>
            LIVRA est un logiciel de gestion de e-commerce (SaaS) permettant aux vendeurs de gérer
            commandes, clients, livraisons et publicités Facebook Lead Ads depuis une interface
            unifiée. Le service est accessible sur iOS, Android et web.
          </p>

          <hr style={hr} />

          {/* 2. Acceptation des conditions */}
          <h2 style={sectionHeading}>2. Acceptation des conditions</h2>
          <p style={bodyText}>
            L&apos;utilisation de LIVRA implique l&apos;acceptation pleine et entière des présentes
            conditions. Si vous n&apos;acceptez pas ces conditions, vous ne pouvez pas utiliser le
            service.
          </p>

          <hr style={hr} />

          {/* 3. Inscription et compte utilisateur */}
          <h2 style={sectionHeading}>3. Inscription et compte utilisateur</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              Vous devez fournir des informations exactes lors de l&apos;inscription
            </li>
            <li style={listItem}>
              Vous êtes responsable de la confidentialité de vos identifiants
            </li>
            <li style={listItem}>
              Un compte est strictement personnel et ne peut être partagé
            </li>
            <li style={listItem}>
              Vous devez avoir au moins 18 ans pour utiliser LIVRA
            </li>
          </ul>

          <hr style={hr} />

          {/* 4. Engagements du vendeur */}
          <h2 style={sectionHeading}>4. Engagements du vendeur</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              Vous vous engagez à ne vendre que des produits légaux et conformes à la législation
              applicable
            </li>
            <li style={listItem}>
              Vous vous engagez à honorer vos commandes et livraisons confirmées
            </li>
            <li style={listItem}>
              Tout usage frauduleux (faux leads, manipulation des données, revente d&apos;accès)
              entraîne la résiliation immédiate sans remboursement
            </li>
            <li style={listItem}>
              Vous êtes responsable de la légalité des publicités Facebook que vous connectez à
              LIVRA
            </li>
          </ul>

          <hr style={hr} />

          {/* 5. Engagements de LIVRA */}
          <h2 style={sectionHeading}>5. Engagements de LIVRA</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              Nous nous engageons à déployer nos meilleurs efforts pour maintenir le service
              disponible (best effort — pas de SLA garanti en V1)
            </li>
            <li style={listItem}>
              Nous sécurisons vos données conformément à notre{" "}
              <a href="/privacy" style={linkStyle} className="hover:underline">
                Politique de confidentialité
              </a>
            </li>
            <li style={listItem}>
              Nous déployons régulièrement des mises à jour pour améliorer le service
            </li>
          </ul>

          <hr style={hr} />

          {/* 6. Tarification */}
          <h2 style={sectionHeading}>6. Tarification</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              Période d&apos;essai&nbsp;: 15 jours gratuits, sans carte bancaire requise
            </li>
            <li style={listItem}>
              Abonnement mensuel&nbsp;: 1&nbsp;500&nbsp;DA/mois après la période d&apos;essai
            </li>
            <li style={listItem}>
              Modes de paiement acceptés en V1&nbsp;: virement bancaire, Baridi Mob, paiement en
              espèces à La Poste
            </li>
            <li style={listItem}>
              Les tarifs peuvent évoluer avec un préavis de 30 jours
            </li>
          </ul>

          <hr style={hr} />

          {/* 7. Résiliation */}
          <h2 style={sectionHeading}>7. Résiliation</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            <li style={listItem}>
              <strong style={{ color: "var(--ivoire)", fontWeight: 500 }}>Par vous&nbsp;:</strong>{" "}
              à tout moment, sans frais, depuis les réglages de votre compte
            </li>
            <li style={listItem}>
              <strong style={{ color: "var(--ivoire)", fontWeight: 500 }}>Par LIVRA&nbsp;:</strong>{" "}
              en cas de non-respect des présentes CGU, avec notification par email
            </li>
          </ul>

          <hr style={hr} />

          {/* 8. Limitation de responsabilité */}
          <h2 style={sectionHeading}>8. Limitation de responsabilité</h2>
          <p style={bodyText}>
            LIVRA ne saurait être tenu responsable des pertes commerciales résultant d&apos;une
            interruption de service, d&apos;un retard de livraison ou d&apos;une annulation client.
            La responsabilité de LIVRA est limitée au montant payé au cours des 3 derniers mois.
          </p>

          <hr style={hr} />

          {/* 9. Propriété intellectuelle */}
          <h2 style={sectionHeading}>9. Propriété intellectuelle</h2>
          <p style={bodyText}>
            La marque LIVRA, son logo et l&apos;ensemble des éléments graphiques et fonctionnels de
            l&apos;application sont la propriété exclusive de 9516-1998 Québec Inc. Toute
            reproduction sans autorisation est interdite.
          </p>

          <hr style={hr} />

          {/* 10. Litiges et juridiction */}
          <h2 style={sectionHeading}>10. Litiges et juridiction</h2>
          <p style={bodyText}>
            En cas de litige, une résolution amiable sera tentée en priorité (contact&nbsp;:{" "}
            <a href="mailto:hello@golivra.app" style={linkStyle} className="hover:underline">
              hello@golivra.app
            </a>
            ). À défaut&nbsp;:
          </p>
          <ul style={{ paddingLeft: "1.25rem", margin: "0.75rem 0 0" }}>
            <li style={listItem}>
              Pour les utilisateurs en Algérie&nbsp;: juridiction du Tribunal de commerce d&apos;Alger
            </li>
            <li style={listItem}>
              Pour l&apos;entité légale LIVRA&nbsp;: juridiction du Québec (Montréal, Canada)
            </li>
          </ul>

        </article>
      </main>
      <Footer />
    </>
  );
}
