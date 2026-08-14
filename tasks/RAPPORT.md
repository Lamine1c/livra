# RAPPORT.md — REPO WEB (~/livra)

> **Écrit par cc, lu par Claudy.** Le plus récent EN HAUT.
> **ARRÊT = RAPPORT** : tu écris ici à chaque fois que tu rends la main, sans exception.
> Claudy n'a aucun autre moyen de savoir ce qui s'est passé.

---

<!--
FORMAT D'UNE ENTRÉE — le plus récent en haut :

## [ID de la commande] — <ÉTAT>
ÉTAT = FAIT · BLOQUÉ · QUESTION · DÉCOUVERTE · EN COURS

**Ce que j'ai fait** : factuel, avec les hashes de commit et file:line.
**Ce que j'ai vérifié moi-même** : ce que j'ai grepé/lu/testé, pas ce que j'ai supposé.
**Ce qui reste** : précis.
**Ce dont j'ai besoin** : décision, gate device, ou rien.
**Branche / tag** : où vit le travail.
-->

## [POLITIQUE-V3-W15] — FAIT ✅ — 14 août 2026

**➡️ politique v3-2026-08-14 publiable — 10 sous-traitants, 0 affirmation invérifiée, 0 référence orpheline.**

**Livré** sur `feat/politique-v3` (tag `backup/pre-politique-v3-w15`), commit `2fb4198`. `tsc` + `npm run build` **verts**.
Retiré la dernière phrase de §2.8 (« Une mesure d'audience technique, décrite à l'article 4… ») → le paragraphe
se termine sur « …aucun traceur publicitaire tiers » (vrai sans nuance, PostHog n'existe plus).

**Contrôle références croisées orphelines** (grep `audience|analytics|mesure|article 4|§4|événements|PostHog` sur
`privacy/page.tsx`) : **0 orpheline**. Seul match = « **mesures** techniques » au §9 sécurité (`:235`), sans aucun
rapport avec une mesure d'audience. §2.6 (puce usage retirée en W14) et §4 (PostHog retiré en W14) sont cohérents.
§4 compte désormais **10 sous-traitants** (9 puces, Yalidine/Ecotrack partagent la leur).

**Décision Claudy notée** : docs historiques (`AUDIT_WEB`, `LIVRA_MARKETING`, `CLAUDY_ANTIDOTE`, `CLAUDY_FLOW`,
`SESSION_HANDOFF`) **exclus définitivement** du nettoyage — le passé reste dans les docs de travail. Ma question W14 est tranchée.

**Branche `feat/politique-v3` (W11→W15) prête à merger.** Rappels pour Lamine (interdits règle 4) : merge + deploy ;
`npm install` pour régénérer le lockfile (posthog-node retiré) ; supprimer côté Vercel `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (+ `TWILIO_SANDBOX_MODE`/`NEXT_PUBLIC_POSTHOG_*` si présents). Plus rien ne bloque le texte.

---

## [NETTOYAGE-MORTS-W14] — nettoyage FAIT, mais 🔴 §2.8 devient faux (STOP SI) — 14 août 2026

**Livré** sur `feat/politique-v3` (tag `backup/pre-nettoyage-w14`), commit `163284e`. `tsc` + `npm run build` **verts**.

**🔴 PRIORITÉ 1 — `posthog-node` throw sur clé absente ? → NON. AUCUN bug prod.** Le constructeur de base
détecte la clé manquante, **logge une erreur et désactive le client** (`node_modules/@posthog/core/src/posthog-core-stateless.ts:167`
`missingApiKey`, `:171` log, `:194` `disabled`), et `capture()`/`shutdown()` deviennent des no-op via `wrap()`
(`:215-227`). `posthog-node/src/client.ts:53-55` normalise `undefined`→`''` sans throw. Donc les 3 routes
renvoyaient bien **200** en prod malgré la clé absente — pas de faux négatif. (Rien à vérifier dans Sentry.)

**Fait — PostHog** : `src/lib/posthog-server.ts` supprimé · 3 captures + imports retirés (verify-otp/yalidine/
ecotrack) · `next.config.ts` rewrites `/ingest`→posthog retirés · commentaire `instrumentation-client.ts`
(Sentry intact) · dep `posthog-node` retirée de `package.json` · puces §4 + §2.6 de la politique retirées.
**Twilio** : section `.env.example` retirée · 6 commentaires morts reformulés (`whatsapp.ts:4`, `inbound:38`,
`register:108`, `whatsapp-templates.ts:311/348/363`) — **aucun code vivant touché** (STOP SI non déclenché : c'était mort).

**🔴 VERDICT ADVERSAIRE — code propre MAIS la politique casse** : import orphelin 0, variables inutilisées 0,
`next.config` OK (aucun client n'appelle `/ingest`), Sentry client intact, tests 0 réf. **MAIS §2.8 devient FAUX** :
sa dernière phrase « Une mesure d'audience technique, **décrite à l'article 4**, permet de comprendre l'usage »
(`privacy/page.tsx` §2.8) renvoie à un §4 qui ne contient **plus** de mesure d'audience (PostHog retiré).
La commande disait « §2.8 reste tel quel » — mais combiné au retrait PostHog, ça produit une affirmation fausse.
**Je ne bricole pas le texte moi-même (ordre du W-arc).** → **décision Claudy** : retirer/reformuler cette dernière
phrase de §2.8 (le reste — « aucune publicité, aucun ciblage » — reste vrai). **Publication bloquée** jusque-là.

**Variables à supprimer côté Vercel (Lamine — interdit pour moi)** : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_WHATSAPP_FROM` (+ `TWILIO_SANDBOX_MODE` s'il existe encore — vu dans un vieux brief) · côté PostHog :
`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (Lamine a confirmé absent) + `NEXT_PUBLIC_POSTHOG_HOST` si présent.

**Contrôle final `grep -ri "twilio|posthog"`** : **zéro** dans `src/**`, config, `.env.example`, `package.json`, politique.
Résidus (hors périmètre du nettoyage code) : (1) `package-lock.json` → **lockfile à régénérer par `npm install` (Lamine)**,
non fait (règle) ; (2) `tasks/*` → exclus par le contrôle ; (3) **5 docs racine historiques** (`AUDIT_WEB.md`,
`LIVRA_MARKETING.md`, `CLAUDY_ANTIDOTE.md`, `CLAUDY_FLOW.md`, `SESSION_HANDOFF.md`) qui citent Twilio/PostHog comme
**contexte passé** (ex. « 360dialog choisi pour éviter Twilio sandbox »). **Je ne les ai PAS réécrits** : effacer
une décision historique d'un doc de référence (dont les `CLAUDY_*.md`, analogues à `CC_RAPPORT.md` exclu) est
destructif et probablement un oubli de la liste d'exclusion. **À trancher par Claudy** : scrubber l'historique, ou les exclure.

---

## [POLITIQUE-V3-W13] — FAIT ✅ POLITIQUE PUBLIABLE — 14 août 2026

**➡️ politique v3-2026-08-14 publiable — 11 sous-traitants déclarés, 0 affirmation invérifiée.**

**Livré** sur `feat/politique-v3` (tag `backup/pre-politique-v3-w13`), commit `b55d9b6`. `tsc` + `npm run build` **verts**.
Ajout de la seule ligne restante au §4 : « Mapbox (fonds de carte et affichage cartographique, hébergement aux
États-Unis) — coordonnées de localisation affichées lors du suivi d'une livraison en temps réel » (`privacy/page.tsx:168`).
Rien d'autre touché.

**Relecture finale (moi-même, sans sous-agent)** : `grep -c "Mapbox|Expo|PostHog|Twilio"` = **3** → Mapbox 1 · Expo 1 ·
PostHog 1 · **Twilio 0** ✅. §4 = **10 puces (`:159-168`) couvrant les 11 services** de l'inventaire W12 — Yalidine
**et** Ecotrack partagent une puce (`:162`, texte dicté en W11, non modifié). Donc **les 11 destinations réseau sont
toutes déclarées, aucune absente** → pas de STOP SI. Les 3 passes adversaires (W11+W12+relecture W13) sont soldées.

**Récapitulatif publication** : les 10 affirmations vérifiées vraies (purge leads 90 j, purge GPS 30 j, OTP haché
10 min, IP scrubbée Sentry, bcrypt, webhooks HMAC, PostHog sans donnée acheteur, Twilio/MFA retirés) + §4 exhaustif.
**Publication + deploy = Lamine** (interdits règle 4). La branche `feat/politique-v3` porte W11+W12+W13, prête à merger.

---

## [POLITIQUE-V3-W12] — 3 corrections FAITES mais 🔴 ENCORE NON PUBLIABLE (STOP SI : Mapbox) — 14 août 2026

**Livré** sur `feat/politique-v3` (tag `backup/pre-politique-v3-w12`), commit `b431272`. `tsc` + `npm run build` **verts**.
Les 3 corrections dictées sont appliquées **mot à mot** dans `privacy/page.tsx` : §4 +Expo +PostHog · §2.8 reformulée
(publicité niée, analytics déclaré) · §2.6 +puce événements d'usage. Je n'ai PAS touché le texte au-delà du dicté.

**🔴 2ᵉ passe adversaire — un sous-traitant de PLUS manque : STOP SI.** Comme en W11, la liste §4 n'est
**toujours pas exhaustive** → publication **bloquée**. Je ne bricole pas le texte moi-même (ordre de la commande).

**Liste EXHAUSTIVE des destinations réseau tierces (grep de tout `src/**` + `next.config.ts`)** :
| # | Service | Preuve file:line | §4 |
|---|---------|------------------|----|
| 1 | Supabase | `lib/supabase/service.ts:4`, `admin.ts` | ✅ |
| 2 | Vercel (hébergement) | déploiement | ✅ |
| 3 | Meta WhatsApp Cloud API + Lead Ads | `lib/meta.ts:3` (`graph.facebook.com`) | ✅ |
| 4 | Yalidine | `lib/yalidine.ts` (`api.yalidine.app`) | ✅ |
| 5 | Ecotrack (DHD/Anderson) | `lib/ecotrack.ts:10-11` | ✅ |
| 6 | Chargily | `lib/chargily.ts:7` (`pay.chargily.net`) | ✅ |
| 7 | Resend | `api/contact/route.ts:61`, `billing-reminders:52` | ✅ |
| 8 | Sentry | `sentry.server.config.ts:6` | ✅ |
| 9 | Expo (push) | `lib/expo-push.ts:54` (`exp.host`) | ✅ (ajouté W12) |
| 10 | PostHog | `lib/posthog-server.ts` + `next.config.ts:19-27` | ✅ (ajouté W12) |
| 11 | **Mapbox** | `components/track/moto-perso-tracker.tsx:6,74` + `app/locate/locate-map.tsx:4,38` (`NEXT_PUBLIC_MAPBOX_TOKEN`) | **❌ MANQUANT** |

Non-tiers écartés : `golivra.app` (soi), `schema.org`/`w3.org` (métadonnées/SVG), liens sociaux Insta/FB (JSON-LD, aucune
donnée envoyée), URLs en commentaire (doc). **Twilio** = env vars présentes mais **aucun appel réseau** (mort) → pas sous-traitant.
**360dialog** = `D360_WEBHOOK_SECRET` **entrant seulement** ; l'envoi WhatsApp part vers Meta (`graph.facebook.com`) → couvert par Meta.

**PostHog — affirmation « aucune donnée d'Acheteur » : TENUE** (vérifié par moi + adversaire, propriété par propriété) :
`verify-otp:75` `{order_id}` · `yalidine:72` `{order_id, tracking_number, total_amount}` · `ecotrack:83`
`{order_id, carrier, tracking_number, total_amount}` — `distinctId = user.id` (**vendeur**), zéro nom/téléphone/adresse acheteur.

**Ce dont j'ai besoin (Claudy, avant deploy)** : ajouter **Mapbox** au §4 (reçoit la zone GPS de livraison affichée
sur `/track` et `/locate`). Reco de formulation (à valider, je ne l'écris pas) : « Mapbox (fonds de carte et
géolocalisation, hébergement États-Unis) — coordonnées GPS affichées lors du suivi de livraison en temps réel ».
Dès cette 4ᵉ ligne ajoutée, la politique est publiable (les 10 autres sont vérifiées vraies).

---

## [POLITIQUE-V3-W11] — FAIT mais 🔴 NE PAS PUBLIER (STOP SI adversaire) — 14 août 2026

**Livré** sur `feat/politique-v3` (depuis `main`, tag `backup/pre-politique-v3-w11`), commit `04b9b15`.
`tsc` + `npm run build` **verts**. Port **mot à mot** du texte dicté, aucune phrase inventée.
- `privacy/page.tsx` : v3-2026-08-14, §2.4 Meta Lead Ads, §2.5 Livreur (OTP/GPS), §2.6 Sentry, §2.8 stockage local,
  §3 leads, §4 sous-traitants (Twilio **retiré** — 0 occurrence), §5.2, §6 rétention, §7 responsabilité LIVRA/score,
  §8.1 prospects, §9 (MFA **retirée**). PRIVACY_VERSION → v3 (`set-password/route.ts:24`, TERMS inchangé).
  Libellé case SignupModal couvre le score (pas de 2e case, `termsAccepted` intact).
- ⚠️ **Cross-refs internes réalignés au renumérotage** (non dicté, signalé) : §5.1 « 2.5 »→« 2.6 », §8.4 « 2.6 »→« 2.7 ».

**🔴 VERDICT ADVERSAIRE — 6 VRAIES, 2 FAUSSES (prouvé dans le code, vérifié aussi par moi)** :
1. Purge leads 90 j — **VRAIE** (`030_lead_insights.sql:52`, non-convertis + logs). 2. Purge GPS 30 j — **VRAIE** (`032:20`).
3. OTP haché 10 min supprimé après vérif — **VRAIE** (`011_driver_otps.sql`, SHA-256 `resend-otp:66-70`, delete `verify-otp:67`).
6. « Sans IP dans les rapports d'erreur » — **VRAIE** (`sentry.server.config.ts:11` `sendDefaultPii:false` + `sentry-scrub.ts`).
7. Mot de passe bcrypt — **VRAIE** (`set-password:65` bcrypt 12). 8. Webhooks vérifiés crypto — **VRAIE** (HMAC `meta.ts:139-141`).
4. **« Aucun traceur publicitaire tiers » (§2.8) — FAUSSE** : **PostHog** actif (`src/lib/posthog-server.ts`, `.capture()` dans
   `orders/[id]/yalidine,ecotrack,verify-otp`, proxies `next.config.ts:19-27`).
5. **Liste sous-traitants §4 NON exhaustive — FAUSSE par omission** : manquent **Expo** (push livreur, `expo-push.ts:54`
   → `exp.host/--/api/v2/push/send`) **et PostHog** (analytics). Les deux traitent de la PII (tokens device / événements).

**Ce dont j'ai besoin (décision Claudy AVANT tout deploy — STOP SI)** : je n'invente pas de texte légal. Il faut
que Claudy **(a)** ajoute Expo + PostHog à §4 (proposé : « Expo (notifications push livreur, hébergement USA) — jeton
de notification et identifiant d'appareil » ; « PostHog (mesure d'audience, proxifié via golivra.app) — événements
d'usage ») et **(b)** tranche §2.8 (retirer/nuancer « aucun traceur tiers », PostHog étant un traceur analytics).
Le commit est un **checkpoint fidèle** ; **publication bloquée** tant que §4/§2.8 ne sont pas corrigés.

**Autres réponses demandées** : version **arabe** de la politique = **N'EXISTE PAS** (page FR en dur ; `ar.json` n'a
que le label de lien footer `"confidentialite"`) → rien à traduire. Page web **`/rejoindre`** = **N'EXISTE PAS**
(glob `src/app/**/rejoindre/**` vide ; le livreur s'inscrit côté mobile). Page **CGU** ne référence pas la version
de la politique → non touchée. `TERMS_VERSION` inchangé.
## [CONSENTEMENT-LIVREUR-W17] — FAIT (design A) — 14 août 2026

**Livré** sur `feat/consentement-livreur` (tag `backup/pre-consentement-livreur-w17`), commit `5b0a4b2`.
`tsc` + `npm run build` **verts**. Migration **non appliquée** (règle 4). Aucun STOP SI (résolution d'identité
inchangée — juste une colonne lue en plus ; colonnes nullables — aucune acceptation rétroactive fabriquée).
- `034_drivers_terms.sql` : `drivers` +`terms_accepted_at`/`terms_version`/`privacy_version` (nullables) ;
  `driver_otps` +`terms_version`/`privacy_version` (le staging transporte, pas de `terms_accepted_at` ici). Pas d'IP/UA.
- `register` : 2 champs **optionnels** `terms_version`/`privacy_version`, écrits dans l'upsert `driver_otps`.
- `verify-otp` : recopie les 2 versions du staging dans `drivers` + `terms_accepted_at = now()` **serveur**.

**Protection de l'acceptation existante à l'UPDATE** : je lis `drivers.terms_accepted_at` de l'existant (ajouté
au SELECT d'identité, sans changer la logique whatsapp→device_id) et n'ajoute `consentFields` à l'UPDATE que si
**`existingTermsAcceptedAt === null`**. Un ré-enrôlement (nouveau tel/re-scan) ne réécrit JAMAIS une 1re signature ;
un livreur existant sans acceptation (NULL) qui accepte enfin, lui, l'obtient. À l'INSERT, consentFields est toujours posé.

**Validation des versions** (elles viennent du client) : `string`, `≤ 32`, regex `^v\d+-\d{4}-\d{2}-\d{2}$`. Format
invalide/mauvais type/trop long → **ignoré silencieusement** (pas de 400, pas de blocage). **Les DEUX** doivent être
valides pour écrire une acceptation (pas de demi-preuve) ; sinon `consent = {}` → clés omises → l'upsert ne clobbe rien.
Champs absents (app pas à jour) → comportement **strictement inchangé**. On stocke ce que **l'app a affiché**, pas une constante web.

**Verdict adversaire** (sous-agent, 8 attaques) : **inscription non régressée, acceptation robuste — zéro cassage.**
App ancienne OK (spread `{}` inerte, aucun `undefined` dans insert), versions bidon toutes rejetées, ré-enrôlement
préserve la signature, `hasConsent` exige les 2 versions, colonnes nullables, écritures en service_role, aucun trigger.

**Reste (Lamine)** : appliquer 034 (SQL Editor). Le texte + les liens côté **mobile** (l'app doit envoyer les 2
versions) = tour mobile dédié, une fois la politique v3 en ligne. Rien d'autre ne bloque le serveur.

---

## [CONSENTEMENT-LIVREUR-W16] — BLOQUÉ (STOP SI : le stockage force à toucher le tunnel OTP) — 14 août 2026

**Prémisse de la commande cassée (vérifié à la main).** Rien codé (branche `feat/consentement-livreur` +
tag `backup/pre-consentement-livreur-w16` créés, aucun fichier écrit — arrêt avant modif, comme W3/W5/W9).

**Ce que j'ai vérifié** :
1. **`drivers` n'a PAS** `terms_accepted_at`/`terms_version`/`privacy_version` : `016_terms_acceptance.sql:6-8`
   les ajoute à **`vendors_waitlist` seulement**. → migration 034 sur `drivers` **serait** nécessaire.
2. 🔴 **`POST /api/drivers/register` n'écrit PAS dans `drivers`** : il upsert `driver_otps` (staging,
   `register/route.ts:82-95`, onConflict `whatsapp`) puis envoie l'OTP. Le body est `Record<string, unknown>`
   (`:11,:18`) → **pas de schéma strict**, un champ inconnu passerait (ce STOP SI-là n'est PAS déclenché).
3. **Le row `drivers` est créé/mis à jour dans `verify-otp/route.ts:69-128`** (résolution d'identité manuelle :
   par `whatsapp` puis `device_id`, UPDATE si existant `:105-116`, INSERT sinon). C'est LÀ que vit le ré-enrôlement.

**Conséquence — STOP SI déclenché** : stocker l'acceptation sur `drivers` **oblige à modifier `verify-otp`**
(le seul écrivain de `drivers`) = **le tunnel d'inscription**. La commande interdit ça sans feu vert
(« le stockage de l'acceptation oblige à modifier le flow OTP → rapporte, on ne touche pas au tunnel »).
La store dans `register` est impossible (le row `drivers` n'existe pas encore) ; la stocker dans `driver_otps`
la perdrait (le staging est supprimé après vérif, `verify-otp:67`).

**Décision demandée (Claudy)** — 2 designs, tu tranches :
- **(A)** J'ouvre le tunnel **a minima** : `register` accepte `terms_version`/`privacy_version` (optionnels)
  → stockés dans `driver_otps` (2 colonnes ajoutées) → `verify-otp` les **recopie** dans `driverFields`
  (`+ terms_accepted_at = now()` serveur) à l'INSERT **et** préserve une acceptation existante à l'UPDATE
  (ne jamais écraser un `terms_accepted_at` non-null). Migration 034 sur `drivers` **et** `driver_otps`.
  Zéro friction (champs optionnels), mais **touche verify-otp** — c'est pour ça que je demande.
- **(B)** Autre porte d'accroche que tu as en tête (ex. une route post-inscription dédiée).
Dès (A/B) tranché je livre migration + route(s) + adversaire en un tour. **`PRIVACY_VERSION` v2/v3 selon branche
= noté, je n'y touche pas.** Note : le design retenu écrira probablement les versions **envoyées par l'app mobile**
(elle seule sait quel texte elle a affiché), pas une constante web — à confirmer avec (A/B).

---

## [ÉTAT-MERGE] — cc EN PAUSE, `git merge` de Lamine EN COURS — 11 août 2026
> ⚠️ Note hors-conflit (zone commune) — Lamine peut la supprimer en résolvant. cc n'a **rien** commité ce tour.

- **Aucune commande à exécuter** : le `tasks/COMMANDE.md` actuel (version committée de `release/aout`) ne
  contient que **W2 + W3**, déjà FAIT/rapportés → règle 2, je ne réexécute pas. La dernière commande vue au
  tour précédent (W10) a disparu du working tree suite au checkout `release/aout` de Lamine — **COMMANDE.md est stale**.
- **Repo en conflit de merge sur `release/aout`** (`feat/agregat-livraison` → W6/W7 : 031, 032,
  `delivery-insight.ts`, `purge-positions` stagés **proprement**). **`git merge` = interdit absolu (règle 4)** →
  je n'ai NI poursuivi, NI `--abort`, NI résolu les conflits, NI écrasé ce RAPPORT.md en conflit.
- **Résolution `vercel.json`** (2 crons ajoutés au même index) : garder **les 4** →
  `yalidine-poll` (0 9), `billing-reminders` (0 8), `purge-leads` (0 3), `purge-positions` (30 3).
- **Résolution `tasks/RAPPORT.md`** : prendre le côté **`feat/agregat-livraison`** (superset : W9→W1) ;
  le côté HEAD (`release/aout` : W5/W4…) y est déjà contenu.
- **Reste à merger APRÈS** : `feat/lot12-observation` (W10 : observation buyer-score + migration **033** +
  `src/lib/buyer-score-audit.ts`) — **pas inclus** dans ce merge. Puis `.env.example` (2 env vars buyer-score) est
  une modif non stagée présente dans le working tree.
- Branches de travail + tags backup **intacts** : `audit/leads-meta`, `feat/retention-leads-90j`,
  `feat/agregat-livraison`, `feat/lot12-observation`.

## [AGREGAT-LIVRAISON-W5] — BLOQUÉ (STOP SI : chemins de clôture multiples) — 10 août 2026

**Rien codé, aucune branche/tag créés (arrêt avant modif, comme W3).** La commande ordonne le STOP SI
« plusieurs chemins de clôture existent ET le choix du point d'accroche change le sens des données →
rapporte la carte AVANT de coder ». C'est le cas : **3 systèmes de clôture distincts**, et selon
l'accroche `delivery_insights` veut dire deux choses différentes (table gardée à vie → je ne devine pas).

**Carte des clôtures (vérifiée au grep + lecture, file:line)** :
- **Système 1 — moto_perso** (a une ligne `deliveries` + GPS `delivery_positions`) :
  · livrée → `complete-delivery/route.ts:91-107` (deliveries=completed, orders=delivered) ;
  · échec/retour → `cancel-delivery/route.ts:71-93` (+ motif dans `delivery_refusals` via `reason`, wilaya `:119`).
  Les DEUX ont déjà un **verrou d'idempotence naturel** (early-return si status déjà completed/cancelled,
  `complete:60-89` / `cancel:63-69`) → écrire l'insight après le flip = une seule ligne par livraison.
- **Système 2 — transporteur Yalidine/Ecotrack** : clôture par le **cron** `yalidine-poll/route.ts:139-145`
  (orders→delivered/returned). **Aucune ligne `deliveries`, aucun GPS** → distance/geohash impossibles.
- **Système 3 — refus client WhatsApp** : `confirm-order.ts:308-314` (orders→cancelled). Pas de livraison physique.

**Le fork sémantique** : la table est **GPS-centrée** (geohash, `distance_m` via `delivery_positions`,
`duree_s`) et W6 (le but affiché) purgera `delivery_positions` — or **seul le Système 1 en possède**.
→ **Ma recommandation : `delivery_insights` = clôtures moto_perso uniquement** (accroche sur
complete-delivery + cancel-delivery). Les Systèmes 2/3 n'ont ni GPS ni `deliveries` à purger : leur y
mettre une ligne (distance NULL, geohash NULL) diluerait la table et ne sert aucune rétention.

**Décision demandée (1 seule)** : `delivery_insights` couvre-t-il **(A) moto_perso seul** *(ma reco,
je livre immédiatement : migration 031 + accroche sur les 2 routes + idempotence par le verrou existant)*,
**ou (B) aussi** les clôtures transporteur (cron) et refus WhatsApp *(alors statut_final sans GPS,
distance/geohash NULL pour eux — dis-le et je code B)* ?
Points que je traiterai au codage une fois (A/B) tranché : `delivered_on` en **UTC+1 (DZ)** documenté ;
**geohash dégradé à ~20 km en wilaya peu peuplée** si l'adversaire juge 5 chars ré-identifiants.

---

## [RETENTION-LEADS-W4] — FAIT (reprise de W3, 3 arbitrages appliqués) — 10 août 2026

**Livré** sur `feat/retention-leads-90j` (tag `backup/pre-retention-w4-20260810`), commit `2b53d3a`.
`tsc --noEmit` + `npm run build` **verts**. Aucune migration appliquée, aucune prod appelée (règle 4).
1. `supabase/migrations/030_lead_insights.sql` : table **`lead_insights`** (anonyme, `outcome` ∈
   converted/not_converted/never_created, wilaya/page_id/form_id/ad_id nullable) + RLS service_role +
   fonction SQL **`purge_expired_leads(p_dry)`**. Choix clé : la mutation est **une transaction SQL
   atomique** (verrous `FOR UPDATE`, `now()` DB) car `lead_insights` n'a **aucune clé de dédup** →
   l'exactly-once est impossible en JS. Passe **unique par lead**, log=pivot, ordre FK imposé
   insight→delete log→delete order→delete client (si aucun autre order, re-vérifié dans le WHERE).
2. `src/app/api/cron/purge-leads/route.ts` : auth `Bearer CRON_SECRET`, `?dry=1` délègue le flag à la
   fonction (logique unique, zéro duplication). 3. `vercel.json` : cron `0 3 * * *`.

**Ce que le dry-run purgerait aujourd'hui** : **0** (projection). Le webhook est posé récemment, aucun
lead n'a 90 j → toutes les branches renvoient des compteurs nuls. À **confirmer au gate** par Lamine
(`GET /api/cron/purge-leads?dry=1` avec le header CRON_SECRET) — non exécutable depuis ce repo (règle 4).

**Verdict adversaire** (sous-agent, il attaquait) : race/FK/**idempotence**/fuseau = **SÛRS**.
- **Idempotence : SÛRE.** Fonction = 1 transaction plpgsql sans `EXCEPTION` → tout-ou-rien ; relancée
  le même jour, les logs déjà supprimés ne sont plus trouvés → **zéro doublon d'insight**.
- **Risque doublon order webhook (évalué, NON corrigé — hors périmètre, comme demandé)** : si Meta
  ré-émet un `leadgen_id` d'un lead **not_converted** déjà purgé, l'idempotence webhook
  (`route.ts:52-59`) ne trouve plus le log ET `orders.meta_lead_id` est libéré → un 2e order peut
  naître. **Probabilité faible** (Meta ne ré-émet pas un lead de +90 j). Pour un lead **converti**,
  l'order est gardé → `meta_lead_id` UNIQUE bloque le doublon.
- Deux nits non bloquants signalés : (a) `?dry=1` pose quand même les `FOR UPDATE` (locks brefs,
  crons à heures disjointes → OK) ; (b) `meta_lead_logs` n'a pas de `UNIQUE(lead_id)` (défaut
  pré-existant de 013/webhook, hors périmètre) → au pire 2 insights pour un même lead en cas de
  double-log, jamais un crash.

**Ce dont j'ai besoin (décision/gate Lamine)** : appliquer la migration 030 (SQL Editor), lancer le
dry-run pour confirmer le 0, puis décider d'activer le cron réel. Rien d'autre ne bloque.
## [LOT12-SCORE-W9] — BLOQUÉ (2 STOP SI : appelant mobile + pas d'order_id à la création) — 11 août 2026

**Rien codé, aucune branche/tag créés (arrêt avant modif). Le trou reste ouvert — à traiter, mais le
design « input = order_id » ne tient pas tel quel.** Grep exhaustif fait (sous-agent + moi).

**STOP SI n°1 — un appelant mobile EXISTE** (règle : « ne casse pas le mobile en silence ») :
- Aucun appelant web (grep `buyer-score` sur `src/**` = 0 hors la route elle-même).
- Mobile confirmé : `CC_RAPPORT.md:691-694` pilote un libellé par `buyerScore.level` ; composant
  `BuyerScoreBadge` (jauge 3 segments) `CC_RAPPORT.md:707`. Changer `whatsapp→order_id` **casse le mobile** en prod.

**STOP SI n°2 — pas d'`order_id` au moment du check** (le cas que la commande dit de rapporter) :
- Le badge score vit sur l'**écran 5 = création de commande** (`CC_RAPPORT.md:682-694`, `newOrder`, formulaire).
  Le vendeur tape le numéro de l'acheteur et voit le score **pendant la saisie, avant que la commande/le
  client existent** → **aucun `order_id` (ni `client_id`) disponible**. Le socle « order_id du vendeur »
  est donc incompatible avec l'usage n°1. Je n'invente pas d'exception (la commande l'interdit).

**Couche 1 (verdict seul)** : l'UI chiffrée `delivered/declined/total` n'existe **pas dans ce repo** (front
vendeur = mobile). Le mobile lit au moins `.level` ; s'il affiche aussi les 3 chiffres, c'est côté mobile
(non vérifiable ici). Retirer ces champs = risque mobile → à coordonner, pas fait.

**Couche 2 (log 033)** : non écrite — couplée au contrat order_id non tranché (loguer un order_id qui n'existe
pas encore n'a pas de sens). Je la livrerai avec le contrat final.

**Autres surfaces d'énumération repérées (listées, NON corrigées ce tour)** :
- `buyer-score/route.ts:31-34` (clients par phone_normalized) + `:48-51` (orders par client_id) = LE trou.
- `confirm-order.ts:83-89` et `:177-183` : lecture cross-vendeur de tous les orders en attente OTP (filtre
  téléphone fait en JS après coup). **Gated par la signature HMAC Meta** du webhook → non exploitable par un
  vendeur, risque moindre, mais surface transversale réelle à durcir plus tard.

**Décision demandée (Claudy/Lamine) avant que je code** : comment scorer sans `order_id` à la création ?
Options, sans que j'en invente une : **(a)** le mobile crée d'abord un **brouillon de commande** (order/client
draft) puis score par `order_id` — nécessite un changement mobile coordonné ; **(b)** clé = `client_id`
possédé par le vendeur (ne couvre pas un tout nouveau numéro) ; **(c)** garder le numéro en entrée mais tuer
l'énumération autrement (canary + rate-limit + log — la commande l'a écarté « on supprime l'input », mais le
cas création le remet sur la table). Dès (a/b/c) tranché **et** le changement mobile planifié, je livre web+033.

---

## [ADVERSAIRE-032-W8] — FAIT (agent frais, NON interrompu) — 11 août 2026

**Sous-agent adversaire indépendant relancé — cette fois il a tourné jusqu'au bout (pas d'interruption).**
Aucune modification de code (aucun défaut certain trouvé). Branche `feat/agregat-livraison`, rien commité en code.

**Attaques tentées → résultat** (chacune vérifiée par l'agent, file:line) :
1. WHERE purge protège courses actives/récentes (`status IN(...) AND completed_at IS NOT NULL AND < now-30j`) → **TENU** (032:33-35).
2. Chemin de clôture posant un statut final SANS completed_at (re-grep) → **TENU** : les 3 chemins posent tous completed_at (complete-delivery:100, driver/cancel-delivery:76, orders/[id]/cancel-delivery:63). Aucun 4e chemin.
3. Réouverture completed/cancelled → active → **TENU** : `start-delivery:63-68` n'autorise que active→active ; statut final immuable.
4. Autres statuts finaux ? → **TENU** : CHECK 006:17/008:20 = {active, completed, cancelled} exhaustif.
5. Side-effects hors delivery_positions (trigger/cascade/Realtime/RLS) → **TENU** : cascade FK dans l'autre sens, aucun trigger, DELETE Realtime isolé par RLS service_role (020).
6. `?dry=1` mute quelque chose → **TENU** : branche p_dry = `SELECT COUNT` seul.
7. Idempotence + race clôture-pendant-purge → **TENU** : cutoff figé, 30j d'écart rend la collision impossible.
8. **Couple 031+032 — perte d'insight** → **DOUTE (non bloquant)** : si `recordMotoInsight` (after(), best-effort, pas de retry) échoue à la clôture, l'insight manque ET les positions sont purgées 30j après → distance perdue. **Ce n'est PAS un bug de 032** ; c'est une limite de résilience de **031**. Corriger = retry/fallback sur 031 = refonte → STOP SI respecté, je ne touche pas.
9. Ordre temporel insight-avant-purge → **TENU** : insight à T0, purge à T0+30j.
10. `recordMotoInsight` lit les positions à la clôture (pas 30j après) → **TENU** : la purge ne prive jamais l'insight de sa distance.

**LIGNE FINALE : la 032 est SÛRE à appliquer en production.** Seule dette de vérification / surveillance
(pas un correctif ce tour) : monitorer les logs `[delivery-insight] insert failed` ; si taux > ~0.1 %,
envisager (lot ultérieur) un retry/fallback sur 031 + backfill. **À trancher par Claudy** — pas fait ici (STOP SI refonte 031).

---

## [PURGE-GPS-W7] — FAIT (complément de W6, même branche) — 11 août 2026

**Livré** sur `feat/agregat-livraison` (par-dessus W6, tag `backup/pre-purge-gps-w7`), commit `2a7fb9b`.
`tsc` + `npm run build` **verts**. Migration **non appliquée** (règle 4).
- `supabase/migrations/032_purge_delivery_positions.sql` : fonction SQL atomique
  `purge_expired_positions(p_dry)` — supprime `delivery_positions` des livraisons clôturées
  (`deliveries.status IN ('completed','cancelled')`) dont la clôture date de **> 30 j**.
- `src/app/api/cron/purge-positions/route.ts` (auth `Bearer CRON_SECRET`, `?dry=1`) + `vercel.json` **3h30**.

**Colonne de clôture retenue** : `deliveries.completed_at` (schéma `006_deliveries_tracking.sql:15`),
posée par TOUS les chemins : `driver/complete-delivery:100`, `driver/cancel-delivery:76`,
`orders/[id]/cancel-delivery:63`. Jamais NULL sur une course clôturée → pas d'approximation (garde
`completed_at IS NOT NULL`). Pas de STOP SI.

**Ce que le dry-run purgerait aujourd'hui** : non exécutable depuis le repo (règle 4). Projection : les
positions des courses de **test clôturées avant W6** (> 30 j) — à confirmer au gate via
`GET /api/cron/purge-positions?dry=1`. Backfill d'insights probablement inutile (données de test).

**Verdict adverse (fait par moi — sous-agent adversaire interrompu 2×)** : (1) clôture concurrente
impossible à toucher (`completed_at < now-30j` exclut toute course fraîche) ; (2) `DELETE … USING` ne
touche QUE `delivery_positions` (la cascade FK est dans l'autre sens, table feuille, aucun trigger) ;
(3) idempotent ; (4) `?dry=1` = COUNT seul, aucun verrou ; (5) legacy `completed_at NULL` protégé.
Seul nit : `deliveries.completed_at` non indexé → seq-scan possible à gros volume (OK V1 ; index non
ajouté car périmètre = `delivery_positions` uniquement).

**Ce dont j'ai besoin** : au gate, Lamine applique 032 + lance le dry-run. Rien d'autre ne bloque.

---

## [AGREGAT-LIVRAISON-W6] — FAIT (décision B, les 3 modes) — 10 août 2026

**Livré** sur `feat/agregat-livraison` (branche depuis `main`, tag `backup/pre-agregat-w6-20260810`),
commit `1bcf881`. `tsc` + `npm run build` **verts**. Migration **non appliquée** (règle 4).
- `supabase/migrations/031_delivery_insights.sql` : table anonyme `delivery_insights` (`mode` ∈
  moto_perso/transporteur/refus_client, wilaya, commune, geohash, distance_m, duree_totale_s,
  duree_course_s, statut_final, motif_echec, delivered_on) — **aucun** id/order/client/driver. RLS service_role.
- `src/lib/delivery-insight.ts` : helper best-effort (ne throw jamais) — geohash, distance GPS (haversine),
  durées, `delivered_on` en **UTC+1 DZ**.
- **4 accroches** : `complete-delivery` (moto delivered, + chemin repair), `cancel-delivery` (moto returned,
  motif=reason), `yalidine-poll:153+` (transporteur, **uniquement transition→delivered/returned**),
  `confirm-order` Branche B (refus_client, garde `.neq("status","cancelled").select()`).

**Idempotence prouvée par mode** : moto = early-return status completed/cancelled ; transporteur = poll
ne fetch que `status='shipped'` + garde de rang → sort du scope après transition ; refus = garde `.neq`
(car `findPendingForPhone` ne filtre pas le status). Le refus utilise `after()` → zéro latence webhook.

**Choix geohash = 4** (moi + adversaire) : 4 (~760 km²) est **plus grossier qu'une commune rurale DZ
(10-50 km², déjà stockée)** → n'ajoute aucune précision sub-commune ; 5 approcherait la maille commune,
3 serait plus grossier qu'une wilaya (inutile). **Verdict adversaire** : race/fuseau/NULL-GPS/refus = SÛRS.
Résidu signalé : `distance_m`+`duree_course_s`+commune+date+motif rare peuvent fingerprinter une course —
**borné** car table service_role uniquement (pas d'expo publique) ; à bucketiser si dashboard public un jour.
Double-insert moto en race **parallèle** (double-tap) non dédup-able (anonymat interdit `delivery_id`) →
le re-pass **séquentiel** (cas demandé) est couvert ; parallèle = risque résiduel documenté.

**Ce dont j'ai besoin** : rien pour livrer ; au gate, Lamine applique 031 (SQL Editor). W7 (purge
`delivery_positions`) reste une commande future — **aucune purge codée ici** (respecté).

---

## [AGREGAT-LIVRAISON-W5] — BLOQUÉ→RÉSOLU par W6 — 10 août 2026
> Carte des 3 chemins de clôture livrée (commit `028c0db` sur `feat/retention-leads-90j`). Décision B
> prise par Claudy → traitée en W6 ci-dessus.

## [RETENTION-LEADS-W4] — FAIT — 10 août 2026
> Purge leads 90j + `lead_insights` : migration 030 + `/api/cron/purge-leads` + cron `vercel.json`,
> commit `2b53d3a` sur `feat/retention-leads-90j` (rapport détaillé `143f077` sur cette branche).
> `tsc`+build verts, dry-run projeté 0, non appliquée (gate Lamine).
## [LOT12-OBSERVATION-W10] — FAIT (option c, phase 1 = observer) — 11 août 2026

**Livré** sur `feat/lot12-observation` (depuis `main`, tag `backup/pre-lot12-obs-w10`), commit `a3e9364`.
`tsc` + `npm run build` **verts**. Migration **non appliquée** (règle 4). **Contrat API inchangé → zéro
changement mobile** (résout le blocage W9). Aucune sanction (c'est la phase 2).
- `033_buyer_score_audit.sql` : `buyer_score_lookups` (id, user_id, **phone_hash**, level, created_at ;
  index (user_id,created_at)) + `buyer_score_canaries` (phone_normalized PK, note, created_at ; **vide**,
  Lamine sème au gate). RLS service_role.
- `src/lib/buyer-score-audit.ts` + accroche `after()` dans `buyer-score/route.ts` (2 sorties) : log best-effort,
  canari→`Sentry` niveau error **silencieux** (réponse `nouveau` identique, détection hors chemin critique),
  alerte volume `BUYER_SCORE_ALERT_THRESHOLD` (défaut 150/24 h glissantes), une par vendeur/jour (fingerprint).
- Env : `BUYER_SCORE_HASH_SALT` (secret HMAC, `.env.example`, jamais commité) + `BUYER_SCORE_ALERT_THRESHOLD`.

**STOP SI vérifiés** : latence → tout en `after()` (chemin critique intact) ; sel → env var (absent ⇒ log
ignoré, jamais de numéro en clair) ; **buyer-score n'est appelé par aucun flux serveur auto** (grep : 0
appelant hors la route ; appelant = mobile, contrat non touché). Autres surfaces d'énum (confirm-order,
gated HMAC Meta) : déjà listées W9, non touchées.

**Verdict adversaire — hash SOLIDE** : HMAC-SHA256 avec clé secrète env protège la petite plage DZ (~10⁸)
contre le brute-force/pré-calcul **tant que le sel ne fuit pas** ; sans le sel, non ré-inversible. Pas de
fuite de numéro en clair (hash avant tout insert, aucun `console.log` du numéro). RLS service_role → un
vendeur ne peut pas lire les canaris. **2 durcissements appliqués suite à son passage** : gate sur insert OK
(anti-spam Sentry si DB down) + dédup en fenêtre `[seuil..seuil+5)` / canari `[1..3]` (robuste à la
concurrence, ne rate pas le franchissement). Reste : le hash n'est aussi bon que le secret du sel (gate Lamine).

**Ma reco chiffrée phase 2** (à recalibrer sur la data réelle — c'est le but de l'observation) : d'après le
code, un vendeur honnête score **1 numéro à la fois** au fil de ses commandes → ordre de grandeur **5-100/j**,
actif **~150/j**. Hypothèses de départ à remplacer par le p99 observé sur 2-4 semaines : **alerte 150**,
**dégradation douce > ~250/24 h**, **cap dur ~500/24 h** — jamais en dessous du p99 des vrais vendeurs.

**Ce dont j'ai besoin (gate Lamine)** : appliquer 033, poser `BUYER_SCORE_HASH_SALT`, semer les canaris.

---

## [RETENTION-LEADS-W3] — BLOQUÉ (STOP SI déclenché) — 10 août 2026
> **Résolu par W4 ci-dessus** (les 3 arbitrages demandés ont été tranchés par Claudy).

**Rien n'a été écrit ni commité.** Je me suis arrêté AVANT toute modif : deux STOP SI de la commande
sont remplis (schéma FK rend la suppression risquée/ambiguë + une instruction contredit le code réel).
La table `lead_insights` est gardée **à vie** ; écrire de mauvais `converted` est irréversible → je ne devine pas.

**Ce que j'ai vérifié moi-même (file:line, lecture seule)** :
1. 🔴 **FK bloquante non gérée par la spéc** : `meta_lead_logs.order_id → orders(id)` **sans ON DELETE**
   (`supabase/migrations/013_meta_lead_ads.sql:100`). Un lead non converti a un log `order_created`
   pointant sur son order (`webhook route.ts:149-151`). La séquence spéc « Cible A supprime l'order,
   puis Cible B supprime les logs » **plante en FK violation** : impossible de DELETE l'order tant que
   le log le référence. Il faut supprimer/annuler le log AVANT l'order → A et B ne sont pas indépendants.
2. 🔴 **Conflit sémantique `converted`** : `meta_lead_logs.status='order_created'` ≠ « converti ». Ce
   statut est posé dès l'INSERT de l'order (`route.ts:149-151`), donc un lead **non converti**
   (order resté `pending_confirmation`) a AUSSI un log `order_created`. La règle Cible B « log
   order_created ⇒ `converted=true` » écrirait `true` pour des non-convertis **et** créerait un
   **doublon contradictoire** avec la ligne `converted=false` déjà écrite par Cible A sur le même lead.
   → Le vrai signal de conversion est `orders.status != 'pending_confirmation'` (le vendeur a agi), pas
   le statut du log.
3. `orders.client_id → clients(id)` **sans ON DELETE** (`001_initial_schema.sql:45`) : bon filet
   anti-orphelin, mais impose de supprimer les orders avant le client.
4. Pas de trigger sur `orders`/`clients` (`001:113-129` = trigger sur `auth.users` uniquement).
5. Auth cron = `Bearer ${process.env.CRON_SECRET}` (`yalidine-poll/route.ts:32-37`) — pattern OK à reprendre.
6. `ad_id` n'est PAS une colonne de `meta_lead_logs` : il vit dans `raw_payload` JSONB (`013:99`) →
   lecture via `raw_payload->>'ad_id'`.

**Ce dont j'ai besoin (décision Claudy/Lamine avant de coder)** :
- **(a)** Redéfinir `converted` = « order existe ET `status != 'pending_confirmation'` », dérivé des
  `orders` au moment de la purge — PAS du statut du log. Je réécris Cible A/B autour de ça ?
- **(b)** Valider l'ordre de suppression imposé par la FK : par lead → écrire l'insight → supprimer le
  log → supprimer l'order → supprimer le client (si aucun autre order). OK pour fusionner A+B en une
  seule passe par lead au lieu de deux cibles séparées ?
- **(c)** Que faire des logs `received`/`error` >90j (jamais devenus order) : insight `converted=false`
  avec les seuls champs campagne du `raw_payload`, ou suppression sèche sans insight ?
Dès que ces 3 points sont tranchés je livre migration + route + vercel.json + dry-run sur
`feat/retention-leads-90j`. **Le dry-run purgerait aujourd'hui : très probablement 0** (webhook posé
récemment, aucun lead n'a 90 j) — à confirmer au gate, pas depuis ce repo.

**Branche / tag** : aucun créé (arrêt avant modif). Working tree sur `main`, propre.

---

## [CHORE-BOUCLE-W2] — FAIT — 10 août 2026

**Ce que j'ai fait** : commit `c51c6d5` sur `main` — `tasks/boucle.sh` (patch validé : retrait
`--autocompact`, `dontAsk`→`acceptEdits`) + `tasks/COMMANDE.md`. Tag backup
`backup/pre-chore-boucle-20260810` avant. Exception main accordée par la commande, respectée
(2 fichiers d'outillage, zéro code applicatif).
**Ce que j'ai vérifié moi-même** : `git diff main -- tasks/boucle.sh` **vide** ; `git status` propre ;
`boucle.sh` reste **exécutable** (`-rwxr-xr-x`) — le patch faisait tomber le bit +x (100755→100644),
je l'ai préservé via `git add --chmod=+x` puis `git checkout --` pour aligner le working tree.
**Ce qui reste** : rien. **Ce dont j'ai besoin** : rien. **Branche / tag** : `main` @ `c51c6d5`,
tag `backup/pre-chore-boucle-20260810`.

---

## [AUDIT-LEADS-W1] — FAIT (audit lecture seule) — 10 août 2026

**Livré** : `tasks/AUDIT_LEADS_META.md` (8 questions sourcées `file:line`), commit `91e4077` sur
branche `audit/leads-meta`, tag backup `backup/pre-audit-leads-20260810`. **Pas de push** (interdit).
Zéro ligne de code applicatif touchée. 3 sous-agents parallèles + 1 relecteur adversaire (n'a rien pu casser).

**Ce qui EXISTE et marche** (vérifié à la main, pas supposé) :
- Webhook `POST/GET /api/meta/leads/webhook` : handshake `hub.challenge` OK, **signature `x-hub-signature-256`
  vérifiée correctement** (body raw via arrayBuffer avant parse, HMAC SHA-256 timing-safe, `meta.ts:133-145`).
- Souscription page en code : POST `subscribed_apps` `subscribed_fields:"leadgen"` (`subscribe/route.ts:30`).
- Lead → commande **automatique** : `meta_lead_logs` → `clients` → `orders` (`status=pending_confirmation`,
  `source=meta_lead_ads`). Payload webhook brut conservé (`meta_lead_logs.raw_payload` JSONB).
- **PII de lead stocké** : nom, téléphone, wilaya (table `clients`) + `leadgen_id/page_id/form_id/ad_id/created_time`.
  Les autres réponses du formulaire ne sont PAS stockées.

**Ce qui MANQUE / BLOQUE l'App Review `leads_retrieval`** :
1. 🔴 Politique de confidentialité déclarant ces champs + durée : à rédiger (aucune n'existe).
2. 🔴 **Aucune rétention codée** (pas de purge/TTL/cron) → "indéfini" = motif de rejet fréquent. `disconnect`
   supprime les tokens mais PAS les leads/clients/orders.
3. ⚠️ **Les scopes OAuth (`leads_retrieval`…) ne sont PAS dans ce repo** — ils vivent dans `~/livra-mobile`.
   Non vérifiable ici. Tokens stockés **en clair** (Q7), `expires_in` non persisté, pas de refresh auto.

**Ce dont j'ai besoin (décision Lamine)** : la **rétention des leads** — TRANCHÉE le 10 août (purge 90j,
voir W3). Détail complet dans `tasks/AUDIT_LEADS_META.md`. **Note** : ce rapport W1 vit sur la branche
`audit/leads-meta` (commit `7583722`) ; recopié ici pour que `main` ait l'historique complet.
