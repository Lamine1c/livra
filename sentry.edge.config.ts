// Sentry — runtime edge (middleware next-intl). Chargé par instrumentation.ts.
import * as Sentry from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  sendDefaultPii: false,

  integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  tracesSampleRate: 0.1,

  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
});
