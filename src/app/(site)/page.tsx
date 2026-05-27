import { MapPin } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Section from "@/components/site/Section";
import WaitlistForm from "@/components/site/WaitlistForm";
import FadeIn from "@/components/site/FadeIn";
import PainMarquee from "@/components/site/PainMarquee";
import WhatsAppWall from "@/components/site/WhatsAppWall";
import CinemaMode from "@/components/site/CinemaMode";

export const metadata = {
  title: "LIVRA — L'OS de votre e-commerce",
  description:
    "LIVRA est le système qui connecte vos pubs Facebook à vos livraisons. Pour les e-commerçants en Algérie et la diaspora. Bientôt disponible.",
  openGraph: {
    title: "LIVRA — L'OS de votre e-commerce",
    description:
      "LIVRA est le système qui connecte vos pubs Facebook à vos livraisons. Pour les e-commerçants en Algérie et la diaspora. Bientôt disponible.",
    url: "https://golivra.app",
    siteName: "LIVRA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LIVRA — L'OS de votre e-commerce",
    description:
      "LIVRA est le système qui connecte vos pubs Facebook à vos livraisons.",
  },
};

const PILLARS = [
  {
    step: "01",
    title: "Zéro lead perdu.",
    body: "Vos leads Facebook entrent automatiquement dans LIVRA. Plus d'export CSV à 23h.",
  },
  {
    step: "02",
    title: "Vos clients vivent une expérience Amazon.",
    body: "Ils reçoivent un lien WhatsApp. Ils voient leur livreur en direct sur une carte. Ils savent quand il sonne à la porte.",
  },
  {
    step: "03",
    title: "Vos livreurs ne se perdent plus.",
    body: "QR code, GPS, itinéraire optimisé. Le bon colis au bon endroit, à la bonne heure.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="pt-32 pb-24 md:pt-48 md:pb-32 px-6 text-center">
          <FadeIn>
            <h1
              className="text-ivoire text-5xl md:text-7xl font-semibold leading-tight"
              style={{ letterSpacing: "-0.03em" }}
            >
              Sortez de la jungle.
            </h1>
          </FadeIn>

          <FadeIn delay={80}>
            <p className="text-mist text-lg md:text-xl font-normal max-w-2xl mx-auto mt-6 leading-relaxed">
              LIVRA est l&apos;OS de votre e-commerce. De la pub Facebook au scan
              du colis, tout passe par un seul système.
            </p>
          </FadeIn>

          <FadeIn delay={160}>
            <div className="mt-10">
              <a
                href="#waitlist"
                className="bg-terracotta text-ivoire font-semibold rounded-[28px] px-8 py-4 inline-block hover:brightness-110 transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                style={{
                  boxShadow: "var(--shadow-btn-primary)",
                  minHeight: "52px",
                  lineHeight: "1",
                }}
                aria-label="Rejoindre la liste d'attente"
              >
                Rejoindre la liste d&apos;attente
              </a>
            </div>
          </FadeIn>

          {/* scroll teaser */}
          <FadeIn delay={280}>
            <p
              className="text-mist mt-16 text-sm"
              style={{ opacity: 0.5 }}
              aria-hidden="true"
            >
              Vous vous reconnaissez là-dedans ? ↓
            </p>
          </FadeIn>
        </div>

        {/* ── Wall of Pain — Marquee ────────────────────────── */}
        <div style={{ paddingBottom: "5rem", overflow: "hidden" }}>
          <PainMarquee />
        </div>

        {/* ── Wall of Pain — WhatsApp ───────────────────────── */}
        <Section>
          <FadeIn>
            <p className="text-mist text-xl text-center mb-12">
              Ça ressemble à votre groupe WhatsApp ?
            </p>
          </FadeIn>
          <FadeIn delay={80}>
            <WhatsAppWall />
          </FadeIn>
        </Section>

        {/* ── Le système LIVRA — CinemaMode ────────────────── */}
        <div className="px-6">
          <FadeIn>
            <p className="text-mist text-xl text-center pt-16 pb-0">
              Voilà à quoi ressemble votre semaine.
            </p>
          </FadeIn>
          <CinemaMode />
        </div>

        {/* ── Trois piliers ─────────────────────────────────── */}
        <Section>
          <FadeIn>
            <p className="text-mist text-xl text-center mb-16">
              Un seul système. De la pub à la porte.
            </p>
          </FadeIn>

          <div className="flex flex-col gap-10 max-w-2xl mx-auto">
            {PILLARS.map(({ step, title, body }, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="flex flex-row gap-6 items-start">
                  <span
                    className="font-semibold text-xl shrink-0"
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      color: "var(--terracotta)",
                    }}
                    aria-hidden="true"
                  >
                    {step}
                  </span>
                  <div>
                    <p className="text-ivoire font-semibold mb-1">{title}</p>
                    <p className="text-mist text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </Section>

        {/* ── Pour qui ─────────────────────────────────────────── */}
        <Section className="max-w-3xl">
          <FadeIn>
            <div
              className="py-8"
              style={{
                borderTop: "var(--border-faint)",
                borderBottom: "var(--border-faint)",
              }}
            >
              <p className="text-ivoire text-xl md:text-2xl font-medium text-center max-w-2xl mx-auto">
                LIVRA est conçu pour les e-commerçants algériens et la diaspora.
                Que vous fassiez 30 ou 3&nbsp;000 commandes par mois.
              </p>
            </div>
          </FadeIn>
        </Section>

        {/* ── Localisation ─────────────────────────────────── */}
        <Section className="max-w-2xl text-center">
          <FadeIn>
            <MapPin
              size={28}
              strokeWidth={1.5}
              style={{ color: "var(--mist)", margin: "0 auto 1rem" }}
              aria-hidden="true"
            />
            <p className="text-mist text-sm leading-relaxed">
              Mobile et tablette disponibles dès maintenant.
              Dashboard web bientôt.
            </p>
          </FadeIn>
        </Section>

        {/* ── CTA final ────────────────────────────────────────── */}
        <Section id="waitlist" className="text-center">
          <FadeIn>
            <h2
              className="text-ivoire text-3xl md:text-4xl font-semibold"
              style={{ letterSpacing: "-0.02em" }}
            >
              Bientôt disponible. Soyez prévenu.
            </h2>
            <p className="text-mist text-center mt-4 mb-10">
              Les premiers inscrits auront accès au dashboard web en avant-première.
            </p>
            <div className="max-w-md mx-auto">
              <WaitlistForm />
            </div>
          </FadeIn>
        </Section>
      </main>

      <Footer />
    </>
  );
}
