# AUDIT_WEB.md — Rapport d'état `~/livra/` (vitrine web)

**Date de l'audit :** 7 mai 2026  
**Auditeur :** Claude Code (claude-sonnet-4-6)  
**Branche :** `main`  
**Statut :** Lecture seule — aucun fichier modifié  
**Basé sur :** Bible V2.1 (`~/livra-mobile/LIVRA_BIBLE.md`)

---

## Section 1 — Vue d'ensemble du repo

### Versions

| Composant | Version |
|---|---|
| Next.js | `16.2.4` |
| React | `19.2.4` |
| TypeScript | `^5` (devDep) |

### Top 15 dépendances (ordre fonctionnel)

| # | Dépendance | Version | Rôle |
|---|---|---|---|
| 1 | `next` | 16.2.4 | Framework web |
| 2 | `react` / `react-dom` | 19.2.4 | Rendu UI |
| 3 | `@supabase/supabase-js` | ^2.104.0 | Client Supabase (auth + DB) |
| 4 | `@supabase/ssr` | ^0.10.2 | Helpers SSR Supabase (cookies) |
| 5 | `posthog-js` | ^1.372.6 | Analytics client (vendeur, motard) |
| 6 | `posthog-node` | ^5.32.1 | Analytics server-side (events OTP, Yalidine) |
| 7 | `lucide-react` | ^1.8.0 | Icônes (landing page + dashboard) |
| 8 | `tailwind-merge` / `clsx` | — | Helpers classes CSS |
| 9 | `qrcode.react` | ^4.2.0 | QR code SVG — utilisé dans `delivery-mode-section.tsx` |
| 10 | `@radix-ui/react-avatar` | ^1.1.11 | **NON UTILISÉ** — importé nulle part |
| 11 | `@radix-ui/react-dialog` | ^1.1.15 | **NON UTILISÉ** — importé nulle part |
| 12 | `@radix-ui/react-dropdown-menu` | ^2.1.16 | **NON UTILISÉ** — importé nulle part |
| 13 | `@radix-ui/react-label` | ^2.1.8 | **NON UTILISÉ** — importé nulle part |
| 14 | `@radix-ui/react-select` | ^2.2.6 | **NON UTILISÉ** — importé nulle part |
| 15 | `@radix-ui/react-separator` | ^1.1.8 | **NON UTILISÉ** — importé nulle part |

> ⚠️ Les 6 packages `@radix-ui/*` sont dans `package.json` mais aucun n'est importé dans le code source. Ce sont des dépendances orphelines probablement héritées d'une tentative d'UI library non finalisée.

### Git

| Info | Valeur |
|---|---|
| Dernier commit | `f76b7d2` — 2026-05-05 |
| Message dernier commit | `feat(orders): QR smart for moto_perso delivery mode + scan validation endpoint` |
| Nombre de commits | **124** |
| Branche actuelle | `main` |

### Fichiers critiques

| Fichier | Présent | Note |
|---|---|---|
| `.env.local` | ✅ | Gitignored — credentials dev |
| `.env.example` | ✅ | Template correctement documenté |
| `.env.production` | ✅ | Généré par Vercel CLI, gitignored — contient un OIDC token JWT (voir Q5) |
| `next.config.ts` | ✅ | Rewrites PostHog `/ingest/*` |
| `tsconfig.json` | ✅ | Strict mode, alias `@/*` → `src/` |
| `vercel.json` | ✅ | Cron configuré — **MAIS schedule erroné** (voir Section 4) |
| `src/middleware.ts` | ✅ | Délègue à `lib/supabase/middleware.ts`, exclut `/api/cron` |

---

## Section 2 — Structure de `src/app/` (App Router)

| Chemin | Rôle apparent | Catégorie | Statut |
|---|---|---|---|
| `src/app/page.tsx` | Landing page vitrine (hero, features, nav, footer) | VITRINE | ACTIF |
| `src/app/layout.tsx` | Layout racine (head, globals.css) | VITRINE | ACTIF |
| `src/app/globals.css` | Styles globaux Tailwind v4 | VITRINE | ACTIF |
| `src/app/favicon.ico` | Favicon | VITRINE | ACTIF |
| `src/app/auth/login/page.tsx` | Login email/password → redirige vers `/dashboard` | AUTH | VESTIGE_VENDEUR |
| `src/app/auth/register/page.tsx` | Inscription vendeur (nom, boutique, email, mdp) → `/dashboard` | AUTH | VESTIGE_VENDEUR |
| `src/app/auth/verify-email/page.tsx` | Page "vérifiez votre email" post-signup | AUTH | VESTIGE_VENDEUR |
| `src/app/auth/callback/route.ts` | Échange code OAuth → session → redirect `/dashboard` | AUTH | VESTIGE_VENDEUR |
| `src/app/auth/signout/route.ts` | POST signout → redirect `/` | AUTH | VESTIGE_VENDEUR |
| `src/app/dashboard/page.tsx` | Dashboard vendeur (stats 2×2 mobile + table desktop) | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/layout.tsx` | Layout dashboard (Sidebar + `w-0 flex-1`) | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/orders/page.tsx` | Liste commandes avec filtres | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/orders/loading.tsx` | Skeleton loader commandes | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/orders/[id]/page.tsx` | Détail commande (OTP widget, QR, Yalidine) | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/orders/[id]/edit/page.tsx` | Édition commande | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/orders/new/page.tsx` | Nouvelle commande (long formulaire) | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/clients/page.tsx` | Liste clients | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/clients/loading.tsx` | Skeleton loader clients | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/clients/[id]/page.tsx` | Détail client | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/clients/new/page.tsx` | Nouveau client | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/settings/page.tsx` | Paramètres (profil + Yalidine + déconnexion) | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/settings/settings-form.tsx` | Composant formulaire profil | VENDEUR | VESTIGE_VENDEUR |
| `src/app/dashboard/settings/yalidine-form.tsx` | Composant formulaire Yalidine | VENDEUR | VESTIGE_VENDEUR |
| `src/app/livreur/[id]/page.tsx` | Dashboard motard web (stats livraisons, boutiques, cash) | MOTARD | VESTIGE_MOTARD |
| `src/app/livreur/rejoindre/page.tsx` | Form inscription motard web (4 champs) → insert `drivers` table | MOTARD | VESTIGE_MOTARD |
| `src/app/api/scan/route.ts` | GET — Validation token QR HMAC + retour données commande | API | ACTIF |
| `src/app/api/cron/yalidine-poll/route.ts` | GET — Polling Yalidine + notifications WhatsApp | API | ACTIF |
| `src/app/api/orders/[id]/generate-qr/route.ts` | POST/DELETE — Génère token QR HMAC pour commande | API | ACTIF |
| `src/app/api/orders/[id]/driver-notify/route.ts` | POST — Notif WhatsApp acheteur "livreur en route" | API | À CLARIFIER |
| `src/app/api/orders/[id]/send-otp/route.ts` | POST — Génère OTP + envoi WhatsApp acheteur (Twilio ou Meta) | API | À CLARIFIER |
| `src/app/api/orders/[id]/verify-otp/route.ts` | POST — Vérifie OTP, passe commande en `confirmed` | API | À CLARIFIER |
| `src/app/api/orders/[id]/yalidine/route.ts` | POST — Crée bon Yalidine + passe commande en `shipped` | API | ACTIF (sera appelé par mobile) |
| `src/app/api/auth/` | Répertoire vide | — | VIDE |

---

## Section 3 — Auth web (cas spécial)

### Fichiers présents dans `src/app/auth/`

| Fichier | Rôle |
|---|---|
| `login/page.tsx` | Login email/password, redirige vers `/dashboard` après succès |
| `register/page.tsx` | Inscription vendeur (nom, boutique, email, mdp) avec PostHog tracking |
| `verify-email/page.tsx` | Page statique "vérifiez votre email" |
| `callback/route.ts` | Échange code OAuth → session Supabase |
| `signout/route.ts` | POST, détruit la session, redirige vers `/` |

### Qui utilise ces pages ?

- `login` et `register` : appelés depuis la landing page (`/`) via les CTAs "Connexion" et "Commencer gratuitement"
- `callback` : appelé par Supabase après confirmation email (emailRedirectTo = `window.location.origin/auth/callback`)
- `signout` : appelé depuis `SignoutButton` dans le dashboard vendeur web
- `verify-email` : redirigé depuis `register/page.tsx` après signup

### Verdict

**VESTIGE_VENDEUR.** Ces pages servent exclusivement à connecter un vendeur à son tableau de bord web. Puisque le vendeur est 100% mobile selon la Bible, ces pages n'ont plus de raison d'être.

**Nuance pour `auth/callback`** : le callback Supabase est nécessaire **uniquement** si on maintient le flow d'inscription via le web. Si on supprime login/register web, le callback devient orphelin. L'app mobile utilise son propre flow Supabase natif sans passer par cette route web.

**Nuance pour la landing page** : la landing page actuelle a deux CTAs ("Connexion" → `/auth/login`, "Commencer gratuitement" → `/auth/register`). Ces CTAs pointent vers le dashboard web. Après suppression du dashboard, ces liens devront soit être supprimés, soit pointer vers des téléchargements app.

---

## Section 4 — API routes (`src/app/api/`)

| Endpoint | Méthode(s) | Rôle | Utilisé par | Statut |
|---|---|---|---|---|
| `GET /api/scan` | GET | Valide token QR HMAC-SHA256, retourne données commande + vendeur | **Mobile** (`scan.tsx:65`, `verify-otp.tsx:116`) hardcodé `livra-app-dz-26.vercel.app` | **GARDER** |
| `GET /api/cron/yalidine-poll` | GET | Polling Yalidine statuts + WhatsApp notifs vendeur + acheteur | **Vercel Cron** (`vercel.json`) | **GARDER** |
| `POST /api/orders/[id]/generate-qr` | POST + DELETE | Génère/révoque token QR HMAC, update `delivery_mode=moto_perso` | Actuellement: `DeliveryModeSection` (web dashboard) — après cleanup: devra être appelé par **mobile** | **GARDER** |
| `POST /api/orders/[id]/yalidine` | POST | Crée bon Yalidine via API (auth vendeur required) | Actuellement: `YalidineButton` (web dashboard) — après cleanup: devra être appelé par **mobile** | **GARDER** |
| `POST /api/orders/[id]/driver-notify` | POST | Envoie WA à l'acheteur : "Votre livreur X est au pick-up" | Actuellement: `livreur/rejoindre/page.tsx` (vestige motard web) — après cleanup: devra être appelé par **mobile** lors de l'assignation motard | **À CLARIFIER** |
| `POST /api/orders/[id]/send-otp` | POST | Génère OTP 6 chiffres, stocke en DB, envoie WA acheteur | Actuellement: `OtpVerifyWidget` (web dashboard vendeur) — après cleanup: devra être appelé par **mobile** | **À CLARIFIER** |
| `POST /api/orders/[id]/verify-otp` | POST | Vérifie OTP, passe commande en `confirmed`, event PostHog | Actuellement: `OtpVerifyWidget` (web dashboard vendeur) — après cleanup: devra être appelé par **mobile** | **À CLARIFIER** |

### ⚠️ Anomalie critique — Vercel Cron schedule

`vercel.json` déclare :
```json
{ "schedule": "0 9 * * *" }
```

Cela signifie **une seule exécution par jour à 9h UTC**, et non toutes les 5 minutes comme prévu dans la Bible. Le code commente "appelé toutes les 5 minutes" mais le cron réel est journalier. Sur Vercel Hobby, les crons sont limités à une fois par jour — c'est la cause de cet écart.

**Impact :** Le tracking Yalidine "Domino's-style" décrit dans la Bible (polling 5 min) ne fonctionne pas en production avec Vercel Hobby. Les statuts Yalidine ne se mettent à jour qu'une fois par jour.

### ⚠️ Anomalie — URL hardcodée dans le mobile

Le domaine `https://livra-app-dz-26.vercel.app` est hardcodé dans deux fichiers du repo mobile :
- `app/(driver)/scan.tsx:13`
- `app/(driver)/verify-otp.tsx:24`

Ce domaine est le domaine Vercel de dev, pas `golivra.app`. L'API `/api/scan` est sur ce repo web.

### ⚠️ Anomalie — URL hardcodée dans le web

`IndependentDeliveryButton` (`src/components/orders/independent-delivery-button.tsx:22`) génère encore le vieux QR URL :
```
https://livra-app-dz-26.vercel.app/livreur/rejoindre?order=${orderId}
```

Ce composant est obsolète (remplacé par `DeliveryModeSection` qui utilise le QR smart `golivra.app/scan?t=...`).

---

## Section 5 — Composants (`src/components/`)

### `src/components/ui/` — UI primitives

| Fichier | Rôle | Utilisé par | Verdict |
|---|---|---|---|
| `button.tsx` | Bouton primaire/secondaire | Auth pages, dashboard forms | VESTIGE_VENDEUR (utilisé uniquement par code vendeur/auth) |
| `input.tsx` | Champ de saisie avec label | Auth pages, dashboard forms | VESTIGE_VENDEUR |
| `select.tsx` | Select custom (pas Radix) | Dashboard forms | VESTIGE_VENDEUR |
| `card.tsx` | Card avec CardHeader/CardContent | Dashboard desktop | VESTIGE_VENDEUR |
| `badge.tsx` | Badge statut commande | Dashboard | VESTIGE_VENDEUR |
| `toast.tsx` | Notification toast | Dashboard | VESTIGE_VENDEUR |

**Verdict dossier :** Tout à supprimer après suppression du dashboard. Ces composants n'ont pas de valeur pour la vitrine seule — la landing page utilise du HTML brut Tailwind, pas ces primitives.

---

### `src/components/layout/` — Layout dashboard

| Fichier | Rôle | Verdict |
|---|---|---|
| `sidebar.tsx` | Sidebar desktop + nav mobile (commandes, clients, réglages, déconnexion) | VESTIGE_VENDEUR |
| `header.tsx` | Header de page dashboard (titre, bouton retour, cloche) | VESTIGE_VENDEUR |
| `scroll-main.tsx` | Wrapper `<main>` scrollable (iOS-safe) | VESTIGE_VENDEUR |

**Verdict dossier :** 3 fichiers, tout VESTIGE_VENDEUR.

---

### `src/components/dashboard/`

| Fichier | Rôle | Verdict |
|---|---|---|
| `stats-card.tsx` | Card statistique (icône + chiffre + label) — desktop | VESTIGE_VENDEUR |

---

### `src/components/orders/` — Gestion commandes web

| Fichier | Rôle | Verdict |
|---|---|---|
| `orders-table.tsx` | Table desktop des commandes | VESTIGE_VENDEUR |
| `orders-client.tsx` | Wrapper client-side liste commandes | VESTIGE_VENDEUR |
| `order-status-select.tsx` | Dropdown changement statut (PostHog event) | VESTIGE_VENDEUR |
| `order-status-row.tsx` | Ligne statut dans détail commande | VESTIGE_VENDEUR |
| `order-actions-menu.tsx` | Menu 3 points (supprimer, modifier) | VESTIGE_VENDEUR |
| `order-edit-form.tsx` | Formulaire édition commande | VESTIGE_VENDEUR |
| `otp-verify-widget.tsx` | Widget OTP (envoyer/vérifier code WA) — dashboard web | VESTIGE_VENDEUR |
| `tracking-timeline.tsx` | Timeline Yalidine (Domino's-style) | VESTIGE_VENDEUR |
| `yalidine-button.tsx` | Bouton "Créer bon Yalidine" → `POST /api/orders/[id]/yalidine` | VESTIGE_VENDEUR |
| `manual-tracking-form.tsx` | Saisie tracking externe (Yalidine, ZR Express...) | VESTIGE_VENDEUR |
| `independent-delivery-button.tsx` | **OBSOLÈTE** — Ancien QR pointant vers `/livreur/rejoindre` (vieux flow) | VESTIGE_MOTARD |
| `delivery-mode-section.tsx` | Sélecteur mode livraison + QR smart (`golivra.app/scan?t=...`) — utilise `qrcode.react` | VESTIGE_VENDEUR |
| `delete-order-button.tsx` | Bouton suppression commande (PostHog event) | VESTIGE_VENDEUR |

**Verdict dossier :** 13 fichiers, tout à supprimer. `delivery-mode-section.tsx` est le seul qui utilisait le nouveau QR smart, mais son usage passera au mobile.

---

### `src/components/clients/` — Gestion clients web

| Fichier | Rôle | Verdict |
|---|---|---|
| `clients-client.tsx` | Liste clients avec recherche (client-side) | VESTIGE_VENDEUR |
| `new-client-form.tsx` | Formulaire nouveau client (PostHog event) | VESTIGE_VENDEUR |
| `client-edit-form.tsx` | Formulaire édition client | VESTIGE_VENDEUR |
| `delete-client-button.tsx` | Bouton suppression client | VESTIGE_VENDEUR |

**Verdict dossier :** 4 fichiers, tout VESTIGE_VENDEUR.

---

### `src/components/settings/`

| Fichier | Rôle | Verdict |
|---|---|---|
| `signout-button.tsx` | Bouton déconnexion (form POST → `/auth/signout`) | VESTIGE_VENDEUR |

---

## Section 6 — Pages publiques (vitrine)

### Landing page (`src/app/page.tsx`)

**EXISTE.** Contenu actuel :
- Nav : logo LIVRA + "Connexion" + "Commencer gratuitement" (CTAs → web dashboard)
- Hero : "Gérez vos commandes sans friction" — tagline SaaS générique
- Features : 3 cards (Gestion commandes, Base clients, Statistiques)
- Footer : "© 2026 Godzii Media — 9516-1998 Québec Inc."

**Problèmes avec la landing page actuelle :**
1. Les CTAs pointent vers le dashboard web vendeur (qui doit être supprimé)
2. Le design est light mode (fond blanc emerald-50) — en contradiction avec le design system "Ombre sur Glace" (#1a1b1f) de la Bible
3. La copy est générique SaaS ("Gérez vos commandes") — pas le pitch "vendeur sort de la jungle" prescrit par la Bible
4. Aucun CTA vers le téléchargement de l'app mobile
5. **Aucun canal d'acquisition vendeur** clairement affiché

### Blog

**ABSENT.** Pas de `/blog` ni de structure blog dans `src/app/`.

### Pages légales (privacy, terms, cookies)

**ABSENTES.** Aucune page `/privacy`, `/terms`, `/cookies` dans `src/app/`. La Bible mentionne (triggers Meta WA) que la politique de confidentialité publique sur `golivra.app` est nécessaire pour l'approbation Meta WhatsApp Business API. **BLOQUANT.**

### Page contact, pricing

**ABSENTES.**

### Page tracking acheteur public — CRITIQUE

**ABSENTE.** Il n'existe pas de route `/track/[id]`, `/scan`, ni aucune page permettant à un acheteur de suivre sa livraison depuis le web.

**Analyse détaillée :**
- La Bible (Décision 4, Option a) dit : acheteur voit le motard sur page web publique (lien WhatsApp → navigateur → page LIVRA brandée → carte Google Maps)
- La Bible (Décision 4, Option b) dit : acheteur voit statut Yalidine sur page web publique
- Le repo mobile a `delivery_positions` en Realtime Supabase mais AUCUNE page web ne lit ces positions
- Le repo mobile a `react-native-maps` installé mais jamais utilisé (AUDIT_MOBILE.md confirme)
- Il existe une route `/api/scan` qui valide un QR et retourne des données commande, mais **aucune page frontend** ne s'en sert pour afficher un tracking acheteur

**Ce qui manque pour la page tracking :**
- Route `/track/[orderId]` ou `/scan` (page publique, sans auth)
- Pour option a (motard) : lecture Supabase Realtime de `delivery_positions` + affichage carte (Google Maps ou équivalent)
- Pour option b (Yalidine) : timeline Domino's-style (statut actuel + historique)
- Branding LIVRA (couleurs "Ombre sur Glace")
- Badge motard "LIVRA Verified" (Trust Layer)
- Footer "Vous êtes vendeur ? [S'inscrire]" (canal d'acquisition Bible Phase 2)

**Verdict :** Page tracking acheteur = **À CODER**. C'est la Capacité 1 ET la Capacité 3 de la Bible (tracking live + réduction appels "où est ma commande ?"). **Item de roadmap critique.**

---

## Section 7 — Code à supprimer (résumé)

| # | Chemin | Catégorie | Raison |
|---|---|---|---|
| 1 | `src/app/dashboard/` (dossier entier) | VENDEUR | Dashboard vendeur web — porté en mobile |
| 2 | `src/app/livreur/` (dossier entier) | MOTARD | Flow motard web — remplacé par l'app mobile |
| 3 | `src/app/auth/login/page.tsx` | AUTH | Login web vendeur — vendeur 100% mobile |
| 4 | `src/app/auth/register/page.tsx` | AUTH | Inscription web vendeur — vendeur 100% mobile |
| 5 | `src/app/auth/verify-email/page.tsx` | AUTH | Suite du flow d'inscription web |
| 6 | `src/app/auth/callback/route.ts` | AUTH | Callback OAuth web — plus de flow auth web |
| 7 | `src/app/auth/signout/route.ts` | AUTH | Déconnexion web — plus de session web |
| 8 | `src/components/layout/` (3 fichiers) | VENDEUR | Layout dashboard web |
| 9 | `src/components/dashboard/stats-card.tsx` | VENDEUR | Stats card dashboard web |
| 10 | `src/components/orders/` (13 fichiers) | VENDEUR/MOTARD | UI commandes web |
| 11 | `src/components/clients/` (4 fichiers) | VENDEUR | UI clients web |
| 12 | `src/components/settings/signout-button.tsx` | VENDEUR | Bouton déconnexion web |
| 13 | `src/components/ui/` (6 fichiers) | VENDEUR | Primitives UI utilisées uniquement par le dashboard |
| 14 | `src/lib/supabase/middleware.ts` | VENDEUR | Redirection auth → dashboard web (ne sert que pour `/dashboard`) |
| 15 | `src/middleware.ts` | VENDEUR | Dépend de `lib/supabase/middleware.ts` pour protéger `/dashboard` |
| 16 | `src/app/api/auth/` | VIDE | Répertoire vide |
| 17 | `posthog-setup-report.md` | OUTIL | Rapport de setup PostHog, pas du code |
| 18 | `.claude/skills/` | OUTIL | Skills Claude Code, pas du code produit |

**Note sur items 14–15 (middleware) :** si on supprime `/dashboard`, le middleware de protection n'est plus nécessaire. Toutefois, si on ajoute une future zone protégée (ex: accès admin vitrine), il faudra le réintroduire. → À décider après suppression.

**Note sur `src/components/ui/`** : si la vitrine future intègre des composants React avec formulaires (contact, inscription newsletter), ces primitives pourraient être gardées ou remplacées par des versions allégées. Décision à prendre au moment du refactoring vitrine.

---

## Section 8 — Code à garder (résumé)

| Chemin | Raison |
|---|---|
| `src/app/page.tsx` | Landing page vitrine — À RÉÉCRIRE mais structure à garder |
| `src/app/layout.tsx` | Layout racine — garder |
| `src/app/globals.css` | Styles globaux — garder |
| `src/app/favicon.ico` | Favicon |
| `src/app/api/scan/route.ts` | **Appelé par l'app mobile** — critique |
| `src/app/api/cron/yalidine-poll/route.ts` | Polling Yalidine actif (`vercel.json`) |
| `src/app/api/orders/[id]/generate-qr/route.ts` | Génère QR — sera appelé par mobile |
| `src/app/api/orders/[id]/yalidine/route.ts` | Crée bon Yalidine — sera appelé par mobile |
| `src/lib/supabase/client.ts` | Client Supabase navigateur |
| `src/lib/supabase/server.ts` | Client Supabase serveur (API routes) |
| `src/lib/supabase/service.ts` | Client service role (cron Yalidine) |
| `src/lib/qr-token.ts` | Génération/vérification HMAC token QR |
| `src/lib/yalidine.ts` | Intégration Yalidine (create parcel, fetch status) |
| `src/lib/whatsapp.ts` | Envoi WhatsApp (Twilio + Meta) |
| `src/lib/whatsapp-templates.ts` | Templates messages WhatsApp statuts |
| `src/lib/utils.ts` | Utilitaires (formatCurrency, WILAYAS, etc.) |
| `src/lib/posthog-server.ts` | Analytics serveur |
| `src/types/index.ts` | Types TypeScript partagés |
| `src/middleware.ts` | À adapter (supprimer la protection `/dashboard`) |
| `instrumentation-client.ts` | Init PostHog client |
| `next.config.ts` | Rewrites PostHog |
| `vercel.json` | Cron Yalidine — garder mais corriger schedule |
| `supabase/migrations/` | Référence historique des migrations |
| `.env.example` | Template variables d'environnement |
| `package.json` / `tsconfig.json` | Config projet |

---

## Section 9 — Dépendances inutiles après cleanup

Après suppression de tout le code vendeur/motard/auth :

| Dépendance | Pourquoi inutile | Risque de suppression |
|---|---|---|
| `@radix-ui/react-avatar` | Déjà non utilisé dans le code actuel | Faible |
| `@radix-ui/react-dialog` | Déjà non utilisé dans le code actuel | Faible |
| `@radix-ui/react-dropdown-menu` | Déjà non utilisé dans le code actuel | Faible |
| `@radix-ui/react-label` | Déjà non utilisé dans le code actuel | Faible |
| `@radix-ui/react-select` | Déjà non utilisé dans le code actuel | Faible |
| `@radix-ui/react-separator` | Déjà non utilisé dans le code actuel | Faible |
| `qrcode.react` | Uniquement dans `delivery-mode-section.tsx` (vestige vendeur) | Faible — si mobile génère le QR en natif |
| `lucide-react` | Utilisé dans landing page (Package, ShoppingCart icons) et dashboard | **Garder** pour la landing page et future vitrine |
| `@supabase/ssr` | Nécessaire pour les API routes avec cookies (auth server-side) | **Garder** |

> ⚠️ **Ne pas supprimer `@supabase/ssr`** — utilisé par `lib/supabase/server.ts` et `lib/supabase/middleware.ts` pour les API routes authentifiées (`generate-qr`, `yalidine`, etc.).

**Total potentiellement supprimable : 7 packages** (`@radix-ui/*` × 6 + `qrcode.react`).

---

## Section 10 — Conformité à la Bible

### Règle 2 — Web = vitrine uniquement

**NON-CONFORME.**

Décompte des violations :
- **Pages vendeur (dashboard)** : 14 fichiers dans `src/app/dashboard/`
- **Flow motard (livreur)** : 2 pages dans `src/app/livreur/`
- **Auth web vendeur** : 5 fichiers dans `src/app/auth/`
- **Composants vendeur** : ~30 fichiers dans `src/components/`

**Total : environ 51 fichiers qui violent la Règle 2.**

Le seul fichier VITRINE au sens strict : `src/app/page.tsx` (+ layout.tsx + globals.css).
Les APIs (`src/app/api/`) sont conformes à la Bible (elles supportent le produit mobile).

**La landing page elle-même est partiellement non-conforme** : ses CTAs pointent vers le web dashboard (login, register), pas vers l'app mobile.

---

## Section 11 — Recommandations prioritaires

Ordre logique de cleanup :

1. **Supprimer `src/app/dashboard/`** — gros nettoyage (14 fichiers, zéro dépendance externe vers eux depuis les APIs mobiles)
2. **Supprimer `src/app/livreur/`** — 2 fichiers, flow motard web obsolète
3. **Supprimer `src/app/auth/`** — après confirmation Q1 (voir Section 12)
4. **Supprimer `src/components/` (orders/, clients/, settings/, layout/, dashboard/)** — après step 1-3
5. **Vérifier les 3 APIs "À CLARIFIER"** avant toute suppression : `driver-notify`, `send-otp`, `verify-otp` — confirmer si le mobile les appellera (Q6)
6. **Corriger `vercel.json` schedule** : `"0 9 * * *"` → `"*/5 * * * *"` **si Vercel Pro** ; sinon conserver journalier avec note dans la Bible (Vercel Hobby limite les crons à 1/jour)
7. **Supprimer les 6 `@radix-ui/*`** de `package.json` — déjà inutilisés
8. **Supprimer `qrcode.react`** après suppression de `delivery-mode-section.tsx`
9. **Adapter `src/app/page.tsx`** : supprimer les CTAs vers `/auth/login` et `/auth/register`, ajouter CTA téléchargement app, mettre le design "Ombre sur Glace"
10. **Adapter `src/middleware.ts`** : supprimer la protection `/dashboard` si elle est supprimée (ou simplifier à une no-op)
11. **Coder `/track/[orderId]`** — page tracking acheteur publique (Capacité 1 + 3 Bible) — **CRITIQUE avant lancement**
12. **Coder `/privacy`** — politique de confidentialité — **BLOQUANT pour Meta WA Business API**
13. **Migrer `API_BASE`** dans le mobile (scan.tsx:13, verify-otp.tsx:24) de `livra-app-dz-26.vercel.app` vers `golivra.app` ou `EXPO_PUBLIC_API_BASE`
14. **Supprimer `posthog-setup-report.md`** et `.claude/skills/` — fichiers non-code
15. **Test post-cleanup** : vérifier que `/api/scan` répond toujours aux appels du mobile (le middleware modifié ne doit pas bloquer les routes `/api/*`)

---

## Section 12 — Questions ouvertes pour Lamine

---

### Q1 — L'auth web doit-elle être entièrement supprimée ?

**Contexte :** `src/app/auth/` (login, register, verify-email, callback, signout) sert uniquement à connecter des vendeurs au dashboard web. Le vendeur est maintenant 100% mobile.

**Options :**
- (A) **Tout supprimer** — plus aucun vendeur ne devrait se connecter au web. L'app mobile est l'unique point d'entrée.
- (B) **Garder temporairement** — tant que des vendeurs ont des données sur le dashboard web et n'ont pas migré vers le mobile.
- (C) **Convertir** — transformer `/auth/register` en formulaire de pré-inscription (capture email pour être notifié du lancement de l'app) au lieu d'une vraie inscription.

**Ma recommandation :** (A) directement — la période de transition web → mobile s'est faite hier soir (port du dashboard). Il n'y a pas de vendeurs réels en prod. En V1, tous les vendeurs arrivent par le mobile directement.

---

### Q2 — Le cron Yalidine est-il actif et nécessaire en V1 ?

**Contexte :** `vercel.json` configure le cron `GET /api/cron/yalidine-poll` avec schedule `"0 9 * * *"` (1 fois par jour à 9h UTC). Le code dit "toutes les 5 minutes" mais Vercel Hobby ne supporte pas les crons plus fréquents qu'1 fois/jour.

**Décision requise :**
- Le cron est bien actif (Vercel l'exécute 1x/jour)
- Mais la fréquence réelle (1/jour) est très éloignée de ce que prévoit la Bible (5 min)
- En V1 avec 0 commandes Yalidine réelles, l'impact est nul pour l'instant

**Options :**
- (A) **Garder tel quel** (1/jour) — acceptable pour V1 avec peu de commandes Yalidine
- (B) **Passer à Vercel Pro** (~$20/mo) pour crons fréquents — coût supplémentaire non justifié en V1
- (C) **Edge Function Supabase** — trigger automatique sur changement de statut (architecture différente, pas de polling)

**Ma recommandation :** (A) pour V1. 1 poll/jour est suffisant en démarrage. Documenter l'écart dans la Bible.

---

### Q3 — La page tracking acheteur : à coder en urgence ou après le lancement ?

**Contexte :** La page `/track/[orderId]` est absente. C'est la Capacité 1 de la Bible (tracking GPS live) ET la Capacité 3 (réduction appels "où est ma commande ?"). Sans cette page, le motard envoie sa position GPS dans Supabase mais personne ne peut la voir.

**Blocage pour le lancement :** Si un vendeur assigne un motard en option a (moto_perso), le QR smart est généré mais le lien `golivra.app/scan?t=...` ouvre une API JSON — pas une vraie page. Le flow est cassé côté acheteur.

**Options :**
- (A) **Coder avant le lancement** — la page est le cœur de la valeur différenciante (tracking live). Sans elle, la Capacité 1 n'est pas livrée.
- (B) **Livrer sans** — en V1, forcer tous les vendeurs à utiliser Yalidine (option b) et reporter l'option a.

**Ma recommandation :** (A). La page tracking est un must-have pour que le lien WhatsApp fonctionne. C'est ~1 journée de code. À faire avant le premier vendeur réel.

---

### Q4 — Le domaine `livra-app-dz-26.vercel.app` pointe-t-il vers ce repo ?

**Contexte :** Ce domaine est hardcodé dans 3 fichiers :
- Mobile : `scan.tsx:13` et `verify-otp.tsx:24` — appels API vers `/api/scan`
- Web : `independent-delivery-button.tsx:22` (fichier vestige, QR vieux flow)

**Vérification `.vercel/project.json` :** NON DÉTERMINÉ — À VÉRIFIER MANUELLEMENT. Le fichier `.vercel/project.json` existe mais son contenu n'a pas été lu (contient l'ID projet Vercel).

**Question :** `livra-app-dz-26.vercel.app` et `golivra.app` pointent-ils vers le même deployment Vercel (ce repo) ? Si oui, le mobile peut fonctionner tant que le domaine existe. Si non, il y a une rupture à corriger.

**Ma recommandation :** Lire `.vercel/project.json` et vérifier dans la console Vercel que les deux domaines pointent vers le même projet. Migrer `API_BASE` dans le mobile vers `golivra.app` ou une env var dès que possible.

---

### Q5 — Le fichier `.env.production` contient-il des secrets sensibles ?

**Contexte :** `.env.production` (gitignored, généré par Vercel CLI) contient un `VERCEL_OIDC_TOKEN` de type JWT (~500 chars). Ce fichier existe localement mais n'est pas commité.

**Risque :** Faible — le fichier est gitignored. L'OIDC token est éphémère (expiration incluse dans le JWT : `"exp":1777666169` ≈ expiration dans quelques mois). Pas de secrets de production en clair (SUPABASE keys sont vides dans ce fichier).

**Action :** Aucune urgente. Conserver le gitignore sur `.env.production`.

---

### Q6 — Que faire des 3 APIs "À CLARIFIER" après suppression du dashboard web ?

Les endpoints suivants sont actuellement appelés depuis des pages web qui vont être supprimées. Le mobile en aura besoin mais ne les appelle pas encore :

| Endpoint | Appelé actuellement par | Sera-t-il appelé par le mobile ? |
|---|---|---|
| `POST /api/orders/[id]/driver-notify` | `livreur/rejoindre/page.tsx` (vestige motard web) | Oui — lors de l'assignation d'un motard via mobile |
| `POST /api/orders/[id]/send-otp` | `OtpVerifyWidget` (dashboard web) | Oui — depuis le détail commande mobile |
| `POST /api/orders/[id]/verify-otp` | `OtpVerifyWidget` (dashboard web) | Oui — depuis le détail commande mobile |

**Ma recommandation :** **Garder les 3 routes** — elles ne font que des opérations Supabase et WhatsApp, elles sont utiles au mobile. Les supprimer puis les recréer serait du gaspillage. Le fait qu'elles ne soient plus appelées depuis le web après cleanup n'est pas un problème : elles seront appelées depuis le mobile.

---

*Fin du rapport.*

**Rapport généré : `AUDIT_WEB.md` — 12 sections, 6 questions ouvertes.**
