// PostHog désactivé temporairement — token manquant en prod bloquait le scroll wheel sur Chromium
// À réactiver quand NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN sera configuré dans Vercel

// Sentry — runtime navigateur. Init derrière NODE_ENV === "production" (rien en dev).
import * as Sentry from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  sendDefaultPii: false, // pas d'IP ni de contexte utilisateur

  integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  tracesSampleRate: 0.1,

  // Strip de TOUTE query string (le fetch client /api/track/status?t=<token> partirait sinon).
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
});

// Instrumentation des navigations App Router (tracing des transitions de route).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
