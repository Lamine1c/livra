import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Footer from "@/components/site/Footer";
import ContactForm from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/contact" },
    openGraph: {
      type: "website",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: "/contact",
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

const WHATSAPP_URL = "https://wa.me/213652208485";

export default async function ContactPage() {
  const t = await getTranslations("Contact");
  return (
    <>
      <main style={{ maxWidth: "62rem", margin: "0 auto", padding: "6rem 1.5rem 7rem" }}>
        <h1 className="text-4xl font-semibold mb-3" style={{ color: "var(--ivoire)" }}>
          {t("h1")}
        </h1>
        <p className="text-lg mb-12" style={{ color: "var(--mist)", maxWidth: "40rem" }}>
          {t("intro")}
        </p>

        <div className="ct-grid">
          <section
            aria-label={t("formAria")}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hair)",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <ContactForm />
          </section>

          <aside
            aria-label={t("asideAria")}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hair)",
              borderRadius: "20px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--ivoire)" }}>
              {t("asideTitle")}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--mist)", lineHeight: 1.6 }}>
              {t("asideBodyPrefix")}<strong>{t("asidePhone")}</strong>{t("asideBodySuffix")}
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--deep)",
                border: "1px solid var(--hair)",
                borderRadius: "999px",
                padding: "13px 24px",
                color: "var(--ivoire)",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span aria-hidden="true">💬</span> {t("ouvrirWhatsapp")}
            </a>
          </aside>
        </div>

        <style>{`
          .ct-grid {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 24px;
            align-items: start;
          }
          @media (max-width: 760px) {
            .ct-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
