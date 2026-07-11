import '@/styles/livra-landing.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import HeroV4 from '@/components/landing/HeroV4';
import PourquoiLivra from '@/components/landing/PourquoiLivra';
import ProductDemo from '@/components/landing/ProductDemo';
import PainWall from '@/components/landing/PainWall';
import Otp from '@/components/landing/Otp';
import Pinpoint from '@/components/landing/Pinpoint';
import Tracking from '@/components/landing/Tracking';
import Philosophy from '@/components/landing/Philosophy';
import FinalCta from '@/components/landing/FinalCta';
import Footer from '@/components/landing/Footer';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata = {
  title: "LIVRA — La transaction protégée des deux côtés",
  description:
    "LIVRA protège chaque livraison des deux côtés : le vendeur est protégé des faux clients (score de fiabilité, OTP de réception), l'acheteur est protégé des arnaques (validation de commande, suivi live).",
  openGraph: {
    title: "LIVRA — La transaction protégée des deux côtés",
    description:
      "LIVRA protège chaque livraison des deux côtés : le vendeur est protégé des faux clients (score de fiabilité, OTP de réception), l'acheteur est protégé des arnaques (validation de commande, suivi live).",
    url: "https://golivra.app",
    siteName: "LIVRA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LIVRA — La transaction protégée des deux côtés",
    description:
      "Le vendeur est protégé des faux clients, l'acheteur est protégé des arnaques. Score de fiabilité, OTP de réception, validation et suivi live.",
  },
};

export default function LandingPage() {
  return (
    <div className={inter.className}>
      <main className="lp">
        <HeroV4 />
        <ProductDemo />
        <PourquoiLivra />
        <PainWall />
        <Otp />
        <Pinpoint />
        <Tracking />
        <Philosophy />
        <FinalCta />
      </main>
      <Footer />
      <Script id="lp-anim" strategy="afterInteractive">
        {`(function () {
          var root = document.documentElement, mq = matchMedia('(prefers-reduced-motion: reduce)');
          function upd(){ (document.hidden || mq.matches) ? root.classList.remove('anim') : root.classList.add('anim'); }
          upd(); document.addEventListener('visibilitychange', upd);
          var io = ('IntersectionObserver' in window && !mq.matches) ? new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
          }, { threshold: 0.18 }) : null;
          document.querySelectorAll('.pql').forEach(function (el) {
            if (io) { io.observe(el); var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); }
            else el.classList.add('is-in');
          });
          setTimeout(function () { document.querySelectorAll('.pql').forEach(function (el) { el.classList.add('is-in'); }); }, 900);
        })();`}
      </Script>
    </div>
  );
}
