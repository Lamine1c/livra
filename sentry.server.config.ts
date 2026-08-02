// Sentry — runtime serveur (Node). Chargé par instrumentation.ts (register).
import * as Sentry from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Rien en dev : on ne capture qu'en production (build Vercel prod/preview).
  enabled: process.env.NODE_ENV === "production",

  // 🔴 PII — Sentry est un tiers. On n'envoie AUCUNE donnée personnelle par défaut :
  sendDefaultPii: false, // pas d'IP, pas de cookies, pas de headers utilisateur

  integrations: [
    // 🔴 AUCUN corps de requête (le webhook WhatsApp porte le numéro ET le message de
    // l'acheteur). sendDefaultPii:false l'exclut déjà ; on le rend EXPLICITE.
    Sentry.requestDataIntegration({ include: { data: false, cookies: false } }),
    // Les lignes [LOT1] sont des console.error : capturées comme events (sans les
    // réécrire) pour pouvoir alerter dessus. captureConsole LIT les logs tels quels.
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ],

  // Tracing léger : rend visibles les pics de 401 UNREGISTERED sur /api/scan (alerte 4).
  tracesSampleRate: 0.1,

  // Strip de TOUTE query string (tokens produit) dans les 3 hooks.
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
});
