import Footer from "@/components/site/Footer";
import JungleHeroV2 from "@/components/site/JungleHeroV2";
import PourquoiLivra from "@/components/site/PourquoiLivra";
import ProductDemo from "@/components/site/ProductDemo";
import PainWall from "@/components/site/PainWall";
import Otp from "@/components/site/Otp";
import Pinpoint from "@/components/site/Pinpoint";
import Tracking from "@/components/site/Tracking";
import Philosophy from "@/components/site/Philosophy";
import FinalCta from "@/components/site/FinalCta";

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

export default function LandingPage() {
  return (
    <>
      <main>
        <JungleHeroV2 />
        <PourquoiLivra />
        <ProductDemo />
        <PainWall />
        <Otp />
        <Pinpoint />
        <Tracking />
        <Philosophy />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
