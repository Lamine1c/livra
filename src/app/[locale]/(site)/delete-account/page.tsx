import type { Metadata } from "next";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Supprimer votre compte — LIVRA",
  description: "Comment demander la suppression de votre compte LIVRA ou de vos données personnelles.",
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

const hr: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.04)",
  marginTop: "2.5rem",
  marginBottom: "0",
};

export default function DeleteAccountPage() {
  return (
    <>
      <main>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "6rem 1.5rem" }}>
          <h1 style={{ color: "var(--ivoire)", fontSize: "2rem", fontWeight: 600, marginBottom: "1rem" }}>
            Supprimer votre compte LIVRA
          </h1>
          <p style={{ ...bodyText, marginBottom: "2.5rem" }}>
            {"Cette page explique comment demander la suppression de votre compte LIVRA (application mobile éditée par LIVRA Technologies) ou la suppression de certaines de vos données sans fermer votre compte."}
          </p>

          <h2 style={sectionHeading}>1. Comment demander la suppression de votre compte</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"Envoyez un email à "}
              <a href="mailto:support@golivra.app?subject=Suppression%20de%20compte" style={linkStyle}>support@golivra.app</a>
              {" avec pour objet « Suppression de compte », depuis l'adresse email associée à votre compte Vendeur. Si vous êtes Livreur, indiquez le numéro WhatsApp utilisé lors de votre inscription."}
            </p>
            <p style={bodyText}>{"Nous confirmons la réception sous 72 heures et traitons la suppression sous 30 jours."}</p>
          </div>

          <hr style={hr} />

          <h2 style={sectionHeading}>2. Données supprimées</h2>
          <div style={sectionBody}>
            <ul style={subList}>
              <li style={listItem}>{"Compte Vendeur : email, nom, téléphone, mot de passe, boutique et paramètres"}</li>
              <li style={listItem}>{"Profil Livreur : prénom, numéro WhatsApp, wilaya, identifiant d'appareil, jeton de notifications"}</li>
              <li style={listItem}>{"Historique de positions GPS lié à vos livraisons"}</li>
              <li style={listItem}>{"Commandes et données clients rattachées à votre boutique"}</li>
            </ul>
          </div>

          <hr style={hr} />

          <h2 style={sectionHeading}>3. Données conservées et durées</h2>
          <div style={sectionBody}>
            <ul style={subList}>
              <li style={listItem}>{"Données de facturation et justificatifs de paiement : conservés pendant la durée exigée par les obligations légales et comptables applicables"}</li>
              <li style={listItem}>{"Journaux techniques de sécurité : conservés au maximum 12 mois"}</li>
            </ul>
          </div>

          <hr style={hr} />

          <h2 style={sectionHeading}>4. Supprimer certaines données sans fermer votre compte</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"Vous pouvez demander la suppression de données spécifiques (par exemple votre historique de commandes) sans supprimer votre compte, par email à "}
              <a href="mailto:support@golivra.app?subject=Suppression%20de%20donn%C3%A9es" style={linkStyle}>support@golivra.app</a>
              {" avec pour objet « Suppression de données ». Voir aussi notre "}
              <a href="/privacy" style={linkStyle}>politique de confidentialité</a>{"."}
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
