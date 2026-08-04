// PostHog désactivé temporairement — token manquant en prod bloquait le scroll wheel sur Chromium
// À réactiver quand NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN sera configuré dans Vercel

// ─────────────────────────────────────────────────────────────────────────────
// Sentry CLIENT (navigateur) VOLONTAIREMENT DÉSACTIVÉ — pas d'init ici.
//
// Le web LIVRA = landing, blog, contact, suivi acheteur PUBLIC. AUCUNE page rendue dans
// le navigateur n'exige une session vendeur (vérifié : 0 `page.tsx` avec auth — l'app
// vendeur est native, « pas de login web »). Le SDK navigateur ne surveillerait donc que
// des VISITEURS ANONYMES, et Sentry dérive `user.geo` (ville/pays) de l'IP de la connexion
// d'ingest = ICI l'IP réelle du visiteur/acheteur — non scrubbable (enrichissement APRÈS
// le scrub, prouvé au gate). → collecte de la géo d'anonymes : zéro valeur pour nous, fuite
// pour eux. L'observabilité web utile est 100 % SERVEUR : voir `instrumentation.ts`
// (register → sentry.server.config / sentry.edge.config), qui reste actif.
// ─────────────────────────────────────────────────────────────────────────────
