import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// [N10-4] En-têtes de sécurité. Les 4 premiers sont ENFORCE (sans risque : aucune page LIVRA
// n'est destinée à être framée ; /track, /locate et les pages bounce s'ouvrent en direct → DENY OK).
// La CSP est en REPORT-ONLY UNIQUEMENT (Next injecte des scripts/styles inline → l'enforcer casserait ;
// on observe d'abord les violations, puis on durcira). Baseline permissive à raffiner sur les rapports
// réels ; idéalement ajouter un endpoint report-to/report-uri pour collecter (TODO, hors périmètre).
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next inline/hydration — assoupli en report-only
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.sentry.io https://api.mapbox.com https://events.mapbox.com https://exp.host https://graph.facebook.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/blog", destination: "/magazine", permanent: true },
      { source: "/blog/:slug", destination: "/magazine/:slug", permanent: true },
      { source: "/tarifs", destination: "/pricing", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  skipTrailingSlashRedirect: true,
};

// Sentry enveloppe le config next-intl (redirects/rewrites conservés). L'upload des
// sourcemaps n'a lieu QUE si SENTRY_AUTH_TOKEN est présent (Vercel uniquement) ; en
// local il est absent → upload sauté, build normal.
// ⚠️ Org en région EU : si le build Vercel échoue « organization not found », ajouter
// `sentryUrl: "https://de.sentry.io/"` ici (à ne pas anticiper).
export default withSentryConfig(withNextIntl(nextConfig), {
  org: "go-livra",
  project: "livra-web",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
