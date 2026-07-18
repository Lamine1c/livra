import { getLocale } from "next-intl/server";
import HeaderGlobal from "@/components/site/HeaderGlobal";

// JSON-LD Organization — présent sur toutes les pages marketing (portée (site)).
// sameAs : réseaux officiels LIVRA (Instagram + page Facebook).
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LIVRA",
  url: "https://golivra.app",
  logo: "https://golivra.app/android-chrome-512x512.png",
  sameAs: [
    "https://www.instagram.com/livra_go",
    "https://www.facebook.com/profile.php?id=1171190276069055",
  ],
};

// Scrollable wrapper for all public site pages.
// The root layout sets body { overflow: hidden } for the app —
// this layout creates a proper scroll context for marketing pages.
// HeaderGlobal is rendered once here so every marketing route shares the
// exact same header (replaces the per-page <Header/> + the LP inline nav).
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // lang={locale} + dir : décision 17 juil — l'AR passe en RTL NATIF (dir="rtl"
  // sur le wrapper marketing). Le RTL retourne texte/colonnes/flex ; les mockups
  // et îlots latins sont ré-isolés en LTR côté CSS (globals.css). FR = dir="ltr".
  const locale = await getLocale();
  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : undefined} className="bg-onyx text-ivoire min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD) }}
      />
      <HeaderGlobal />
      {children}
    </div>
  );
}
