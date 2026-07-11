import { NextIntlClientProvider } from "next-intl";
import frMessages from "@/messages/fr.json";

// Layout des pages /billing — SACRÉES (hors routing i18n : exclues du middleware,
// toujours à /billing/* sans préfixe). On fournit néanmoins un provider next-intl
// en FR figé : ces pages réutilisent le <Footer/> partagé (désormais traduit via
// useTranslations), qui exige un provider. Aucun impact sur le routing/middleware.
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="fr" messages={frMessages}>
      <div
        className="bg-onyx text-ivoire min-h-screen flex flex-col"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
