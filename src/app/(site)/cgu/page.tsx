import type { Metadata } from "next";
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

export default function CguPage() {
  return (
    <>
      <main>
        <article style={{ maxWidth: "48rem", margin: "0 auto", padding: "6rem 1.5rem" }}>

          {/* Title */}
          <h1 style={{ color: "var(--ivoire)", fontSize: "2rem", fontWeight: 600, marginBottom: "1rem" }}>
            Conditions Générales d&apos;Utilisation
          </h1>
          <p style={{ ...metaText, marginBottom: "0.25rem" }}>Version&nbsp;: v2-2026-06-17</p>
          <p style={{ ...metaText, marginBottom: "0.25rem" }}>Dernière mise à jour&nbsp;: 17 juin 2026</p>
          <p style={{ ...metaText, marginBottom: "2.5rem" }}>
            {"Édité par : 9516-1998 Québec inc. (ci-après « LIVRA »), Montréal (Québec), Canada."}
          </p>

          {/* 1. DÉFINITIONS */}
          <h2 style={sectionHeading}>1. DÉFINITIONS</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"1.1. « LIVRA » désigne le logiciel de gestion d'e-commerce et de livraisons exploité par 9516-1998 Québec inc., accessible via application mobile native (iOS, Android) et site web golivra.app."}</p>
            <p style={bodyText}>{"1.2. « Vendeur » désigne toute personne physique ou morale qui souscrit au Service en qualité de commerçant ou de professionnel de l'e-commerce."}</p>
            <p style={bodyText}>{"1.3. « Service » désigne l'ensemble des fonctionnalités de LIVRA : gestion de commandes, anti-fraude (Bouclier), tracking GPS des livraisons, communication WhatsApp automatisée, et toute fonctionnalité ultérieurement ajoutée."}</p>
            <p style={bodyText}>{"1.4. « Acheteur » désigne le client final du Vendeur, destinataire de la livraison."}</p>
            <p style={bodyText}>{"1.5. « Livreur » désigne tout transporteur indépendant ou société de livraison utilisant LIVRA pour exécuter les livraisons."}</p>
          </div>

          <hr style={hr} />

          {/* 2. ACCEPTATION DES CONDITIONS */}
          <h2 style={sectionHeading}>2. ACCEPTATION DES CONDITIONS</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"2.1. L'utilisation du Service est subordonnée à l'acceptation pleine et entière des présentes CGU et de la Politique de confidentialité."}</p>
            <p style={bodyText}>{"2.2. Le Vendeur reconnaît agir exclusivement en qualité de commerçant ou de professionnel et NON en qualité de consommateur. Il déclare disposer de la capacité juridique et des autorisations administratives nécessaires à l'exercice de son activité commerciale dans son pays d'opération."}</p>
            <p style={bodyText}>{"2.3. Acceptation et preuve d'acceptation. L'acceptation des CGU et de la Politique de confidentialité est matérialisée par une case à cocher expresse lors de l'inscription. LIVRA conserve trace de cette acceptation (horodatage UTC, adresse IP, identifiant technique du navigateur, version des documents acceptés) pendant toute la durée du compte et pendant cinq (5) ans à compter de sa résiliation, à titre de preuve opposable au Vendeur en cas de litige."}</p>
          </div>

          <hr style={hr} />

          {/* 3. INSCRIPTION ET COMPTE UTILISATEUR */}
          <h2 style={sectionHeading}>3. INSCRIPTION ET COMPTE UTILISATEUR</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"3.1. Le Vendeur s'engage à fournir lors de l'inscription des informations exactes, complètes et à jour, et à les maintenir à jour pendant toute la durée de son compte."}</p>
            <p style={bodyText}>{"3.2. Le compte est strictement personnel et non transférable. Le partage des identifiants avec un tiers est strictement interdit et constitue un motif de résiliation immédiate."}</p>
            <p style={bodyText}>{"3.3. Le Vendeur doit être âgé de dix-huit (18) ans révolus."}</p>
            <p style={bodyText}>{"3.4. Le Vendeur est seul responsable de la confidentialité de ses identifiants et de toute activité effectuée depuis son compte."}</p>
          </div>

          <hr style={hr} />

          {/* 4. ENGAGEMENTS DU VENDEUR */}
          <h2 style={sectionHeading}>4. ENGAGEMENTS DU VENDEUR</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"4.1. Le Vendeur s'engage à ne commercialiser que des produits et services licites, conformes à la législation du pays dans lequel il opère, et ne portant pas atteinte aux droits de tiers (notamment contrefaçon, propriété intellectuelle, marques déposées)."}</p>
            <p style={bodyText}>{"4.2. Le Vendeur s'engage à honorer les commandes confirmées via le Service et à livrer les Acheteurs dans des délais raisonnables."}</p>
            <p style={bodyText}>{"4.3. Sont strictement interdits, sous peine de résiliation immédiate sans remboursement et de poursuites :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"(a) tout usage frauduleux du Service (création de fausses commandes, manipulation des données, fausses évaluations) ;"}</li>
              <li style={listItem}>{"(b) la revente, sous-licence ou mise à disposition de tout ou partie du Service à un tiers ;"}</li>
              <li style={listItem}>{"(c) toute tentative d'ingénierie inverse, décompilation, scraping automatisé, ou contournement des mesures de sécurité ;"}</li>
              <li style={listItem}>{"(d) tout usage du Service pour des activités illégales, frauduleuses, diffamatoires, ou portant atteinte à l'ordre public ;"}</li>
              <li style={listItem}>{"(e) toute tentative de paiement frauduleuse, y compris la dispute abusive de paiement (chargeback) auprès d'un établissement bancaire pour un Service effectivement rendu."}</li>
            </ul>
            <p style={bodyText}>{"4.4. Garantie et indemnisation. Le Vendeur garantit LIVRA contre toute réclamation, action ou poursuite émanant d'un Acheteur, d'un Livreur, d'une autorité administrative, ou de tout tiers, qui résulterait directement ou indirectement de :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"(a) la non-conformité, l'illégalité, ou la dangerosité des produits commercialisés par le Vendeur ;"}</li>
              <li style={listItem}>{"(b) un manquement du Vendeur à ses obligations envers ses Acheteurs ;"}</li>
              <li style={listItem}>{"(c) une violation par le Vendeur de la législation applicable dans son pays d'opération (fiscalité, protection des consommateurs, protection des données personnelles des Acheteurs, etc.)."}</li>
            </ul>
            <p style={bodyText}>{"Dans tous ces cas, le Vendeur prend à sa charge tous les frais (avocats, juridiques, dommages et intérêts) supportés par LIVRA, et indemnise LIVRA intégralement."}</p>
          </div>

          <hr style={hr} />

          {/* 5. ENGAGEMENTS DE LIVRA */}
          <h2 style={sectionHeading}>5. ENGAGEMENTS DE LIVRA</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"5.1. LIVRA met en œuvre ses meilleurs efforts pour maintenir le Service disponible et fonctionnel (best effort). Aucun engagement de disponibilité (SLA) n'est garanti en version V1 du Service."}</p>
            <p style={bodyText}>{"5.2. LIVRA sécurise les données du Vendeur conformément à sa Politique de confidentialité."}</p>
            <p style={bodyText}>{"5.3. LIVRA peut déployer des mises à jour, correctifs et nouvelles fonctionnalités à tout moment, sans préavis pour les mises à jour techniques mineures."}</p>
          </div>

          <hr style={hr} />

          {/* 6. TARIFICATION ET MODALITÉS DE PAIEMENT */}
          <h2 style={sectionHeading}>6. TARIFICATION ET MODALITÉS DE PAIEMENT</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"6.1. Période d'essai. Tout nouveau Vendeur bénéficie d'une période d'essai de sept (7) jours gratuite, sans engagement et sans carte bancaire requise."}</p>
            <p style={bodyText}>{"6.2. Plans disponibles à la date de la présente version :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"(a) Plan Fondateur : 499 DA par mois, à vie tant que l'abonnement reste actif sans interruption, dans la limite des 100 premières inscriptions ;"}</li>
              <li style={listItem}>{"(b) Plan Standard : 999 DA par mois."}</li>
            </ul>
            <p style={bodyText}>{"6.3. Plan Fondateur — clause de gel tarifaire. Le tarif Fondateur de 499 DA est garanti à vie pour le Vendeur tant que son abonnement reste actif sans interruption de paiement. Ce tarif couvre les fonctionnalités du Plan Fondateur telles qu'elles existent à la date de souscription, ainsi que leurs corrections et améliorations. Les nouvelles fonctionnalités majeures introduites ultérieurement par LIVRA (notamment dans des plans supérieurs type Pro, Business ou Enterprise) ne sont PAS automatiquement incluses dans le Plan Fondateur et peuvent faire l'objet d'options payantes distinctes. En cas d'annulation ou de suspension pour défaut de paiement, le Vendeur perd définitivement le bénéfice du tarif Fondateur et devra souscrire au tarif Standard en vigueur s'il souhaite revenir."}</p>
            <p style={bodyText}>{"6.4. Modes de paiement acceptés. Les modes de paiement sont précisés au Vendeur au moment de la souscription dans l'application."}</p>
            <p style={bodyText}>{"6.5. Évolution des tarifs. LIVRA se réserve le droit de modifier les tarifs du Plan Standard avec un préavis de trente (30) jours notifié par email. Cette clause d'évolution ne s'applique PAS au tarif Fondateur, garanti à vie dans les conditions de l'article 6.3."}</p>
            <p style={bodyText}>{"6.6. Défaut de paiement. En cas de défaut de paiement, LIVRA notifie le Vendeur par email et/ou via l'application. Si le Vendeur ne régularise pas sa situation après plusieurs notifications adressées sur une période raisonnable, son accès au Service est suspendu sans préavis supplémentaire. Le Vendeur reste responsable des sommes dues pour la période d'usage. La réactivation du compte est soumise au règlement intégral des sommes dues."}</p>
          </div>

          <hr style={hr} />

          {/* 7. PROPRIÉTÉ INTELLECTUELLE */}
          <h2 style={sectionHeading}>7. PROPRIÉTÉ INTELLECTUELLE</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"7.1. LIVRA, son logo, sa marque, ses interfaces, son code source, son design, et l'ensemble de ses éléments graphiques, textuels et fonctionnels sont la propriété exclusive de 9516-1998 Québec inc."}</p>
            <p style={bodyText}>{"7.2. Aucune licence, transfert ou cession de droits n'est concédé au Vendeur autre que le droit personnel, non exclusif et non transférable d'utiliser le Service pour la durée de son abonnement."}</p>
            <p style={bodyText}>{"7.3. Toute reproduction, imitation, ou exploitation non autorisée des éléments protégés est strictement interdite et expose son auteur à des poursuites civiles et pénales."}</p>
          </div>

          <hr style={hr} />

          {/* 8. DONNÉES COLLECTIVES ET AGRÉGATION */}
          <h2 style={sectionHeading}>8. DONNÉES COLLECTIVES ET AGRÉGATION</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"8.1. LIVRA collecte, à travers le Service, des données système relatives aux comportements observés (notamment confirmations OTP, livraisons réussies, livraisons refusées, signaux de fraude détectés)."}</p>
            <p style={bodyText}>{"8.2. Le Vendeur reconnaît expressément que LIVRA peut, à des fins d'amélioration du Service, de prévention de la fraude au bénéfice de l'ensemble de sa communauté de Vendeurs, et de développement de fonctionnalités futures, exploiter ces données sous forme anonymisée ou agrégée (statistiques globales, registry de signaux de fraude, etc.)."}</p>
            <p style={bodyText}>{"8.3. Cette exploitation ne porte jamais sur des données nominatives permettant d'identifier un Acheteur individuel sans son consentement exprès."}</p>
          </div>

          <hr style={hr} />

          {/* 9. LIMITATION DE RESPONSABILITÉ */}
          <h2 style={sectionHeading}>9. LIMITATION DE RESPONSABILITÉ</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"9.1. LIVRA est un éditeur de logiciel et un fournisseur d'outils. LIVRA n'est PAS partie aux contrats commerciaux conclus entre le Vendeur et ses Acheteurs, ni aux contrats de transport conclus entre le Vendeur et ses Livreurs."}</p>
            <p style={bodyText}>{"9.2. LIVRA ne saurait être tenu responsable de :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"(a) toute perte commerciale, manque à gagner, ou préjudice indirect résultant d'une interruption de Service, d'un retard de livraison, d'une annulation d'Acheteur, ou d'un litige avec un Livreur ;"}</li>
              <li style={listItem}>{"(b) la qualité, conformité, légalité ou sécurité des produits commercialisés par le Vendeur ;"}</li>
              <li style={listItem}>{"(c) la conduite des Livreurs, qui sont des prestataires indépendants ;"}</li>
              <li style={listItem}>{"(d) tout incident de paiement entre le Vendeur et l'Acheteur, notamment dans le cadre du paiement à la livraison."}</li>
            </ul>
            <p style={bodyText}>{"9.3. La responsabilité totale et cumulée de LIVRA, toutes causes confondues, est expressément limitée au montant des sommes effectivement versées par le Vendeur à LIVRA au cours des trois (3) derniers mois précédant le fait générateur du litige."}</p>
          </div>

          <hr style={hr} />

          {/* 10. RÉSILIATION */}
          <h2 style={sectionHeading}>10. RÉSILIATION</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"10.1. Par le Vendeur. Le Vendeur peut résilier son abonnement à tout moment, sans frais et sans préavis, depuis les réglages de son compte dans l'application. La résiliation prend effet à la fin de la période de facturation en cours."}</p>
            <p style={bodyText}>{"10.2. Par LIVRA. LIVRA peut résilier le compte d'un Vendeur, avec ou sans préavis selon la gravité, en cas de :"}</p>
            <ul style={subList}>
              <li style={listItem}>{"(a) violation des présentes CGU ;"}</li>
              <li style={listItem}>{"(b) usage frauduleux du Service ;"}</li>
              <li style={listItem}>{"(c) défaut de paiement persistant ;"}</li>
              <li style={listItem}>{"(d) atteinte à l'image ou aux intérêts de LIVRA."}</li>
            </ul>
            <p style={bodyText}>{"10.3. Effets de la résiliation. La résiliation entraîne la perte d'accès au Service. Les données du Vendeur sont conservées 30 jours puis supprimées conformément à la Politique de confidentialité."}</p>
          </div>

          <hr style={hr} />

          {/* 11. MODIFICATION DES CGU */}
          <h2 style={sectionHeading}>11. MODIFICATION DES CGU</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"11.1. LIVRA se réserve le droit de modifier les présentes CGU à tout moment."}</p>
            <p style={bodyText}>{"11.2. Toute modification substantielle est notifiée au Vendeur par email et/ou via l'application avec un préavis minimum de trente (30) jours."}</p>
            <p style={bodyText}>{"11.3. La poursuite de l'utilisation du Service après cette période vaut acceptation des nouvelles CGU. Le Vendeur qui refuse les nouvelles CGU peut résilier son compte sans frais durant la période de préavis."}</p>
            <p style={bodyText}>{"11.4. Une ré-acceptation expresse (case à cocher) peut être requise au prochain login après une modification substantielle."}</p>
          </div>

          <hr style={hr} />

          {/* 12. FORCE MAJEURE */}
          <h2 style={sectionHeading}>12. FORCE MAJEURE</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"LIVRA ne saurait être tenu responsable d'un manquement à ses obligations résultant d'un cas de force majeure, notamment : panne d'infrastructure d'un sous-traitant tiers (hébergement, base de données, passerelles de communication), coupure de réseau Internet, guerre, restrictions gouvernementales, catastrophe naturelle."}</p>
          </div>

          <hr style={hr} />

          {/* 13. LOI APPLICABLE ET JURIDICTION COMPÉTENTE */}
          <h2 style={sectionHeading}>13. LOI APPLICABLE ET JURIDICTION COMPÉTENTE</h2>
          <div style={sectionBody}>
            <p style={bodyText}>{"13.1. Les présentes CGU sont régies par les lois de la province du Québec (Canada)."}</p>
            <p style={bodyText}>{"13.2. Tout litige relatif à la conclusion, l'interprétation, l'exécution ou la résiliation des présentes CGU sera soumis à la compétence exclusive des tribunaux de Montréal (Québec, Canada)."}</p>
            <p style={bodyText}>{"13.3. Pour les litiges spécifiquement relatifs à la conformité légale des produits commercialisés par le Vendeur ou des livraisons exécutées sur le territoire algérien, les lois algériennes pertinentes s'appliquent au Vendeur, sans préjudice de la clause d'indemnisation de l'article 4.4."}</p>
          </div>

          <hr style={hr} />

          {/* 14. CONTACT */}
          <h2 style={sectionHeading}>14. CONTACT</h2>
          <div style={sectionBody}>
            <p style={bodyText}>
              Pour toute question relative aux présentes CGU&nbsp;:{" "}
              <a href="mailto:hello@golivra.app" style={linkStyle} className="hover:underline">
                hello@golivra.app
              </a>
            </p>
          </div>

        </article>
      </main>
      <Footer />
    </>
  );
}
