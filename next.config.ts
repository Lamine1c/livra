import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/blog", destination: "/magazine", permanent: true },
      { source: "/blog/:slug", destination: "/magazine/:slug", permanent: true },
      { source: "/tarifs", destination: "/pricing", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
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
