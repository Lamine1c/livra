import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Footer from "@/components/site/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Faq");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/faq" },
    openGraph: {
      type: "website",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: "/faq",
      images: [{ url: "/og-image-livra.png", width: 1200, height: 630, alt: "LIVRA" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: ["/og-image-livra.png"],
    },
  };
}

// 12 Q/R stockées en clés q1..q12 / a1..a12 → source unique de l'accordéon ET du JSON-LD.
const FAQ_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export default async function FaqPage() {
  const t = await getTranslations("Faq");

  // Construit la liste depuis les clés traduites de la locale courante.
  const faq = FAQ_INDEXES.map((i) => ({ q: t(`q${i}`), a: t(`a${i}`) }));

  // JSON-LD FAQPage cohérent avec le contenu de la locale courante (mêmes clés).
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "6rem 1.5rem 7rem" }}>
        <h1 className="text-4xl font-semibold mb-3" style={{ color: "var(--ivoire)" }}>
          {t("h1")}
        </h1>
        <p className="text-lg mb-12" style={{ color: "var(--mist)" }}>
          {t("introPrefix")}
          <Link href="/contact" style={{ color: "var(--terracotta)" }}>
            {t("introLink")}
          </Link>
          .
        </p>

        <div className="faq-list">
          {faq.map((item, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-q">
                <span>{item.q}</span>
                <span className="faq-chevron" aria-hidden="true">{t("chevronAria")}</span>
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
