import { defineRouting } from "next-intl/routing";

// FR = défaut, sans préfixe (URLs existantes intactes). AR = /ar/*.
export const routing = defineRouting({
  locales: ["fr", "ar"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});
