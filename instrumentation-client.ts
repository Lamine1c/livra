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
//
// [T5-1] Next 16 + Sentry exigent un hook `onRouterTransitionStart` exporté ici pour instrumenter
// les navigations client, sinon avertissement de build « ACTION REQUIRED ». On l'exporte pour le
// taire, MAIS comme aucun `Sentry.init()` client n'a lieu (décision ci-dessus),
// `captureRouterTransitionStart` est un no-op : sans client Sentry actif il ne capture ni n'envoie
// RIEN. La décision de confidentialité (zéro télémétrie navigateur, zéro géo d'anonyme) est intacte.
// ─────────────────────────────────────────────────────────────────────────────
import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
