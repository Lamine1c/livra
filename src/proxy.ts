import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

// 🔴 GARDE-FOU : le middleware i18n ne s'exécute QUE sur les routes marketing.
// Sont EXCLUES explicitement (jamais réécrites/redirigées) les routes
// acheteur/livreur/technique SACRÉES — ce sont des liens envoyés par WhatsApp/QR à de
// vrais clients et livreurs : /api, /track, /locate, /oauth, /billing, /ingest, /scan
// (aperçu commande livreur), /livreur (recrutement), /_next, /_vercel, et tout fichier
// à extension (sitemap.xml, robots.txt, favicon, images, …).
export const config = {
  matcher: [
    "/((?!api|track|locate|oauth|billing|ingest|scan|livreur|_next|_vercel|.*\\..*).*)",
  ],
};
