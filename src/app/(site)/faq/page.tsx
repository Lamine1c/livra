import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "FAQ — LIVRA",
  description:
    "Questions fréquentes sur LIVRA : fonctionnement, code de confirmation, score de fiabilité, transporteurs, tarifs, essai, paiement Chargily, données et support.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    title: "FAQ — LIVRA",
    description: "Tout ce qu'il faut savoir sur LIVRA : commandes, confirmation, tarifs, livraison, support.",
    url: "/faq",
    images: [{ url: "/og-image-livra.png", width: 1200, height: 630, alt: "LIVRA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — LIVRA",
    description: "Tout ce qu'il faut savoir sur LIVRA.",
    images: ["/og-image-livra.png"],
  },
};

// Source unique : alimente l'accordéon ET le JSON-LD FAQPage.
const FAQ: { q: string; a: string }[] = [
  {
    q: "Qu'est-ce que LIVRA ?",
    a: "LIVRA est une application mobile pour les vendeurs en paiement à la livraison (COD) en Algérie. Elle protège la transaction des deux côtés : le vendeur est protégé des fausses commandes (validation avant expédition, score de fiabilité), et l'acheteur est protégé des arnaques (commande vérifiée, suivi de livraison en temps réel).",
  },
  {
    q: "Comment ça marche pour un vendeur ?",
    a: "Vous entrez la commande dans l'application. LIVRA envoie un code de confirmation à l'acheteur sur WhatsApp. Une fois la commande validée, vous l'expédiez — via votre propre livreur ou un transporteur — puis vous suivez chaque livraison depuis l'app.",
  },
  {
    q: "C'est quoi le code de confirmation, côté acheteur ?",
    a: "Avant l'expédition, l'acheteur reçoit un code sur son WhatsApp et répond avec ce code pour confirmer sa commande. Cela prouve que le numéro est réel et que l'acheteur veut vraiment recevoir le colis. Sans code validé, la commande n'est pas expédiée.",
  },
  {
    q: "C'est quoi le score de fiabilité ?",
    a: "C'est un indicateur calculé côté serveur à partir de l'historique de commandes d'un acheteur (livraisons réussies contre refus). Il aide le vendeur à repérer un client à risque avant d'expédier. Il fonctionne dans les deux sens : un bon acheteur devient un client vérifié.",
  },
  {
    q: "Quels transporteurs sont supportés ?",
    a: "LIVRA s'intègre avec Yalidine, DHD et Anderson (via Ecotrack), et permet aussi la livraison par votre propre livreur (mode « livreur perso ») avec suivi GPS en temps réel.",
  },
  {
    q: "Combien coûte LIVRA ?",
    a: "L'abonnement est de 999 DA par mois. Les 50 premiers vendeurs bénéficient du tarif Fondateur à 499 DA par mois, verrouillé à vie.",
  },
  {
    q: "Y a-t-il un essai gratuit ?",
    a: "Oui. Chaque compte vendeur démarre avec un essai gratuit de 7 jours donnant accès à toutes les fonctionnalités. À la fin de l'essai, vous activez votre abonnement pour continuer — vos données restent sauvegardées.",
  },
  {
    q: "Comment se paie l'abonnement ?",
    a: "Le paiement se fait en ligne via Chargily (carte CIB / Edahabia). Une fois le paiement confirmé, votre abonnement est activé pour 30 jours.",
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Oui. Les données (commandes, clients, positions GPS) sont isolées par vendeur via des règles d'accès strictes : un vendeur ne voit jamais les données d'un autre. Les coordonnées GPS d'une livraison ne sont visibles que par les personnes concernées et sont purgées après la livraison.",
  },
  {
    q: "Comment recruter mon propre livreur ?",
    a: "Depuis les réglages de l'app, un QR code d'embauche est disponible. Votre livreur le scanne, s'inscrit en quelques champs, puis reçoit les courses que vous lui assignez, avec navigation et suivi en temps réel.",
  },
  {
    q: "Que se passe-t-il si le client refuse à la confirmation ?",
    a: "Si l'acheteur ne valide pas ou répond « non », la commande n'est pas expédiée — vous ne payez pas de livraison pour rien. L'app enregistre le motif (pas disponible, a changé d'avis, a trouvé moins cher) pour vous aider à décider de la suite.",
  },
  {
    q: "Comment contacter le support ?",
    a: "Via la page Contact du site, ou directement sur WhatsApp au +213 652 20 84 85. On répond aux vendeurs comme aux acheteurs.",
  },
];

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "6rem 1.5rem 7rem" }}>
        <h1 className="text-4xl font-semibold mb-3" style={{ color: "var(--ivoire)" }}>
          Questions fréquentes
        </h1>
        <p className="text-lg mb-12" style={{ color: "var(--mist)" }}>
          L&apos;essentiel sur LIVRA. Une autre question ?{" "}
          <Link href="/contact" style={{ color: "var(--terracotta)" }}>
            Écris-nous
          </Link>
          .
        </p>

        <div className="faq-list">
          {FAQ.map((item, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-q">
                <span>{item.q}</span>
                <span className="faq-chevron" aria-hidden="true">+</span>
              </summary>
              <p className="faq-a">{item.a}</p>
            </details>
          ))}
        </div>

        <style>{`
          .faq-list { display: flex; flex-direction: column; gap: 12px; }
          .faq-item {
            background: var(--surface);
            border: 1px solid var(--hair);
            border-radius: 16px;
            overflow: hidden;
          }
          .faq-q {
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
            cursor: pointer; list-style: none;
            padding: 18px 22px;
            color: var(--ivoire); font-size: 16px; font-weight: 600; line-height: 1.4;
          }
          .faq-q::-webkit-details-marker { display: none; }
          .faq-chevron {
            flex-shrink: 0; color: var(--mist); font-size: 22px; line-height: 1;
            transition: transform .2s ease;
          }
          .faq-item[open] .faq-chevron { transform: rotate(45deg); }
          .faq-a {
            margin: 0; padding: 0 22px 20px;
            color: var(--mist); font-size: 15px; line-height: 1.65;
          }
          @media (prefers-reduced-motion: reduce) {
            .faq-chevron { transition: none; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
