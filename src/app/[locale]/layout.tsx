import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Provider sans props : locale + messages viennent de la request config
  // (src/i18n/request.ts). Le <html> reste rendu par le root layout ; la langue
  // du contenu est portée par le wrapper (site)/layout (texte-first, pas de RTL).
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
