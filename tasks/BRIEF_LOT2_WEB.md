# BRIEF — LOT 2 / VOLET WEB · OBSERVABILITÉ (Sentry)
> Source : `PLAN_PRODUCTION.md` LOT 2 + `AUDIT_31JUIL.md` C5 (« Sentry mobile · web · alerts → **0 %**.
> Le mot Sentry n'apparaît nulle part dans le projet »). Volet MOBILE = `~/livra-mobile/tasks/BRIEF_LOT2_MOBILE.md`.
> Stack vérifiée : **Next.js 16.2.4 · React 19.2.4**. Aucun fichier Sentry n'existe (`instrumentation.ts` absent).

## 🎯 POURQUOI CE LOT VIENT JUSTE APRÈS LE LOT 1
Le LOT 1 vient de rendre **141 erreurs visibles** dans les logs, dont les marqueurs `[LOT1]` posés
sur les chemins qui coûtent de l'argent. Sans Sentry, elles meurent dans les logs Vercel que
personne ne lit. **On lance sans savoir quand ça casse.**

## 🔴 LA CONTRAINTE QUI PRIME SUR TOUT — ZÉRO PII CHEZ UN TIERS
On vient de **fermer** une fuite PII (C6 : `/api/scan` renvoyait nom + téléphone + adresse + GPS
domicile de l'acheteuse). **Brancher Sentry avec ses réglages par défaut la rouvre**, cette fois
vers un serveur tiers, et de façon permanente.

**Trois pièges concrets, à traiter explicitement :**
1. **`sendDefaultPii` doit être `false`.** Le quickstart officiel le met à `true`. Non.
2. **Les breadcrumbs réseau capturent les URLs complètes.** Donc `/api/scan?t=<qr_token>&d=<deviceId>` —
   **le token qu'on a passé la journée à verrouiller partirait chez Sentry**. Idem pour les liens de
   suivi acheteur. → `beforeBreadcrumb` : **strip systématique de la query string** sur toute URL,
   ou au minimum des paramètres `t`, `d`, `token`.
3. **Aucun corps de requête.** Le webhook `whatsapp/inbound` porte le numéro **et le message** de
   l'acheteur. `httpBodies: []` / `userInfo: false`.
⚠️ **Conséquence à ne pas oublier** : Sentry devient un sous-traitant de données. Il faudra le
déclarer dans la politique de confidentialité et dans le **Data Safety Play Store** (LOT 3).
Signale-le, ne le rédige pas.

## 📦 CE QU'IL Y A À FAIRE
- `npm i @sentry/nextjs`
- **`instrumentation.ts`** (racine ou `src/`) : import des configs server + edge, **et export
  `onRequestError = Sentry.captureRequestError`** — sans lui, les erreurs de route App Router ne
  remontent pas.
- **`instrumentation-client.ts`** · **`sentry.server.config.ts`** · **`sentry.edge.config.ts`**
- **`next.config.ts`** : envelopper avec `withSentryConfig()` (org + project + `authToken:
  process.env.SENTRY_AUTH_TOKEN`).
- **Env** : `NEXT_PUBLIC_SENTRY_DSN` (public, ok) · `SENTRY_AUTH_TOKEN` (**secret, Vercel
  uniquement, JAMAIS dans un fichier commité ni dans `.env.local`** — ce fichier est déjà signalé à
  l'audit comme une copie périmée de secrets LIVE en clair).
- **Ne rien capturer en dev** : garder l'init derrière `NODE_ENV === "production"`.

## 🚨 LES ALERTES — SEULEMENT CE QUI COÛTE DE L'ARGENT
Pas d'alerte sur « une erreur est survenue ». Quatre règles, mappées sur ce qu'on sait qui casse :

| Alerte | Déclencheur | Pourquoi |
|---|---|---|
| **OTP jamais parti** | `[LOT1][A2] MSG2 (code) ÉCHEC DÉFINITIF` | L'acheteur attend un code qui n'arrivera pas. Commande morte **et faux scammer dans le score.** |
| **Message entrant perdu** | `[LOT1][A3]` release wamid échoué | Un « OUI » perdu définitivement. |
| **Notif lead Facebook non partie** | `[LOT1][A4] meta/leads/webhook` | Le vendeur ne sait pas qu'il a un lead. C'est du CA. |
| **Scan refusé anormalement** | pic de `401 UNREGISTERED` sur `/api/scan` | Le verrou C6 mordrait de vrais livreurs. |

## 📐 CONTRAINTES
- Branche `feat/sentry-web` off `main` (`main` = merge scan-lockdown, déjà en prod). Tag
  `backup/pre-sentry-web`.
- **Ne touche à AUCUN `console.error` existant.** Les marqueurs `[LOT1]` sont des contrats
  d'alerte maintenant. On ajoute Sentry par-dessus, on ne réécrit pas les logs.
- `tsc` + `build` verts. Push sans merger.
- ⚠️ Le `withSentryConfig` modifie le build : **vérifie que le build prod passe** avant de pousser.

## 🔎 AVANT DE CODER — LA RÈGLE DU PÉRIMÈTRE
Mon périmètre est une hypothèse, pas une vérité. **Grep tout le repo** et dis-moi :
1. tous les endroits où une URL avec un token circule (query string) — pour la liste de scrub ;
2. s'il existe déjà un helper de masquage (il y a un `masked` dans `confirm-order.ts`) réutilisable ;
3. si un fichier de config existant entre en conflit avec `instrumentation.ts`.
**Donne-moi la liste avant de commencer.**

## 🚦 GATE
1. Provoquer une vraie erreur en preview → **elle apparaît dans Sentry**, avec une stack lisible.
2. Dans l'event, **vérifier qu'aucune query string ne contient `t=` ou `d=`**, et qu'aucun numéro
   ni adresse d'acheteur n'apparaît nulle part (breadcrumbs inclus). C'est LE point du gate.
3. Déclencher un `[LOT1][A2] ÉCHEC DÉFINITIF` (clé WA invalide, même méthode que le gate LOT 1) →
   **l'alerte part**.
