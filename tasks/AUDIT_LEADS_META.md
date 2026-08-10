# AUDIT_LEADS_META.md — État vérifié de l'intégration Leads Meta (repo web `~/livra`)

> **Commande** : [AUDIT-LEADS-W1] — audit **LECTURE SEULE**. Aucune ligne de code applicatif touchée.
> **Branche** : `audit/leads-meta` — **Tag backup** : `backup/pre-audit-leads-20260810`.
> **Méthode** : grep exhaustif du repo + lecture intégrale des fichiers Meta + 3 sous-agents
> parallèles + 1 relecteur adversaire. Chaque affirmation ci-dessous a été **re-vérifiée à la
> main** dans le fichier source (pas seulement rapportée par un sous-agent).
> **Date** : 10 août 2026.

Fichiers Meta trouvés au grep (`leadgen|hub.challenge|X-Hub-Signature|subscribed_apps|graph.facebook.com|leads_retrieval|page_access` + `meta|oauth|scope|access_token`) :
- `src/app/api/meta/leads/webhook/route.ts` — webhook GET+POST
- `src/app/api/meta/pages/[pageId]/subscribe/route.ts` — souscription page
- `src/app/api/meta/auth/exchange/route.ts` — échange OAuth code→token
- `src/app/api/meta/disconnect/route.ts` — déconnexion
- `src/lib/meta.ts` — helpers Graph API + signature + lead data
- `src/app/oauth/meta-callback/page.tsx` + `client.tsx` — page de callback (relais vers l'app)
- `supabase/migrations/013_meta_lead_ads.sql` — tables + colonnes

---

## Q1 — Le webhook `leadgen` existe-t-il ?

**OUI.** Route : `POST/GET /api/meta/leads/webhook`
(`src/app/api/meta/leads/webhook/route.ts`).

- **GET (handshake de vérification)** : `route.ts:9-18`.
  - `hub.mode` lu `route.ts:10`, `hub.verify_token` lu `route.ts:11`, `hub.challenge` lu `route.ts:12`.
  - Vérification : `route.ts:14` → `if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN)`.
  - Renvoi du challenge : `route.ts:15` → `return new Response(challenge ?? "", { status: 200 })`.
  - Sinon `403 Forbidden` : `route.ts:17`.
  - **Variable d'env du verify_token attendu** : `META_VERIFY_TOKEN` (`route.ts:14`).
- **POST (événement leadgen)** : `route.ts:21-163`. Ne traite que `change.field === "leadgen"` (`route.ts:47`).

---

## Q2 — La signature est-elle vérifiée ?

**OUI, correctement.** file:line :

- Header lu : `x-hub-signature-256` — `route.ts:24`.
- **Body lu en RAW AVANT tout parsing** : `route.ts:23` → `Buffer.from(await req.arrayBuffer())`.
  Le `JSON.parse` n'arrive qu'**après** la vérif, `route.ts:38`. → HMAC calculé sur le body brut, correct.
- Vérif : `route.ts:32` → `if (!verifyWebhookSignature(rawBody, signature, appSecret)) return 403`.
- Implémentation HMAC : `src/lib/meta.ts:133-145`.
  - `meta.ts:139` → `"sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")`.
  - Comparaison **timing-safe** : `meta.ts:141` → `crypto.timingSafeEqual(...)`.
  - Rejette si le header ne commence pas par `sha256=` : `meta.ts:138`.
- **Variable d'env du secret** : `META_APP_SECRET` (`route.ts:25`).

⚠️ **Nuance à connaître (pas un trou de sécurité, mais à noter)** : si `META_APP_SECRET`
n'est pas configuré, le POST renvoie **`200 OK` sans rien traiter** (`route.ts:27-30`) — donc pas
d'acceptation d'un POST non signé, mais un **échec silencieux** (les leads seraient perdus, pas
volés). À surveiller en prod : le secret DOIT être présent.

---

## Q3 — Souscriptions de Page (`subscribed_apps`)

**OUI, activées EN CODE** (pas à la main dans le dashboard).

- POST `/{page-id}/subscribed_apps` : `src/app/api/meta/pages/[pageId]/subscribe/route.ts:28-32`.
  - `subscribed_fields: "leadgen"` — `subscribe/route.ts:30`. (seul champ abonné)
- Symétrique DELETE (désabonnement) : `subscribe/route.ts:67-71`.
- La route exige un JWT Supabase valide (`subscribe/route.ts:22-23`) et le `page_access_token`
  stocké en DB (`subscribe/route.ts:25-26`). Marque `active=true` en DB après succès (`:47-51`).

---

## Q4 — Scopes OAuth demandés

**🔴 DANS CE REPO WEB : AUCUN scope Meta n'est demandé. `leads_retrieval` N'EXISTE PAS ici.**

- Grep `scope|leads_retrieval|pages_show_list` sur `src/**/*.{ts,tsx}` → **zéro** occurrence liée à
  Meta (seuls des `scope` de tokens QR internes dans `src/lib/qr-token.ts`, sans rapport).
- La route web `exchange` reçoit un `code` **déjà autorisé** et se contente de l'échanger
  (`src/app/api/meta/auth/exchange/route.ts:34-35`) — elle ne construit **aucune** URL
  d'autorisation, donc ne déclare aucun scope.
- **Le consentement (et donc la liste des scopes) vit dans le repo MOBILE**, hors de ce repo :
  `~/livra-mobile/lib/meta-oauth.ts` (rapporté par le sous-agent b ; **non re-vérifiable depuis ce
  repo** — à confirmer côté mobile). Scopes rapportés là-bas : `leads_retrieval`, `pages_show_list`,
  `pages_manage_ads`, `pages_read_engagement`, `business_management`, `ads_read`.
  `pages_manage_metadata` **absent**.

➡️ **Conséquence pour l'audit** : la question « quels scopes on demande » **ne se tranche pas dans ce
repo**. C'est un écart de périmètre à vérifier côté `~/livra-mobile` avant l'App Review.

---

## Q5 — Chemin complet d'un lead (POST Meta → base)

`webhook POST` (`route.ts:45-159`), par `change` de champ `leadgen` :

1. **Idempotence** : skip si un log `order_created` existe déjà pour ce `lead_id` — `route.ts:52-59`.
2. **INSERT `meta_lead_logs`** (réception) — `route.ts:62-66`. Colonnes : `lead_id`, `page_id`,
   `form_id`, `raw_payload` (= `change.value`), `status='received'`.
3. Lookup souscription active de la page pour récupérer `page_access_token` + `user_id` (vendeur) —
   `route.ts:71-76`. Si absente → log `status='error'` et skip (`route.ts:78-83`).
4. **Appel Graph API** `getLeadData(leadgenId, pageToken)` — `route.ts:86` → `meta.ts:82-115`
   (récupère `field_data` du lead).
5. **INSERT `clients`** — `route.ts:89-102`.
6. **INSERT `orders`** — `route.ts:108-122`.
7. Push notif vendeur (best-effort, `after()`) — `route.ts:126-146`.
8. **UPDATE `meta_lead_logs`** → `status='order_created'`, `order_id` — `route.ts:149-151`.
9. Sur exception : `meta_lead_logs.status='error'` + `error_message` (`route.ts:152-156`).
10. Réponse **toujours 200** (Meta retente sinon) — `route.ts:162`.

**Un lead devient-il une commande ?** **OUI, AUTOMATIQUEMENT** dès réception du webhook — INSERT
`orders` `route.ts:108-122`, `status='pending_confirmation'`, `source='meta_lead_ads'`,
`total_amount=0`, `notes='… compléter produit + adresse'`. Le vendeur complète ensuite dans l'app.

---

## Q6 — 🔴 LISTE EXHAUSTIVE DES CHAMPS DE LEAD STOCKÉS

### A) Ce qui est extrait du lead Meta via Graph API (`getLeadData`, `meta.ts:82-115`)

Champs demandés à Graph : `field_data,created_time` (`meta.ts:87`). Extraits par matching de nom :
- **name** (nom complet) — dérivé de `first_name/prenom/prénom` + `last_name/nom`, ou
  `full_name/nom_complet` — `meta.ts:103-107`.
- **phone** — clés `phone_number/phone/telephone/téléphone/numéro` — `meta.ts:111`.
- **city** — clés `city/ville/wilaya` — `meta.ts:112`.
- **raw** = réponse Graph complète (`field_data` de TOUTES les questions du formulaire) — `meta.ts:113`.
  ⚠️ **`raw` N'EST PAS persisté** : `getLeadData` le renvoie mais le webhook ne l'écrit nulle part.
  → **Seuls name / phone / city sont sauvegardés.** Les autres réponses du formulaire (ex. produit,
  quantité, message) sont **perdues** aujourd'hui, pas stockées.

### B) Colonnes réellement écrites en base

**Table `clients`** (INSERT `route.ts:89-102`) :
- `user_id` (vendeur) · `full_name` (= name ou "Lead Meta Ads") · `phone` (= phone ou "") ·
  `phone_normalized` (dérivé) · `wilaya` (= city ou "") · `commune` (= "") · `address` (= "") ·
  `notes` (= `"Lead Meta Ads — form {formId}"`).

**Table `orders`** (INSERT `route.ts:108-122`) :
- `user_id` · `client_id` · `reference` (= `LV-META-…`) · `status='pending_confirmation'` ·
  `source='meta_lead_ads'` · `meta_lead_id` (= leadgen_id) · `total_amount=0` · `delivery_fee=0` ·
  `notes` (contient l'`ad_id` s'il existe).

**Table `meta_lead_logs`** (migration `013_meta_lead_ads.sql:94-104` ; INSERT `route.ts:62-66`) :
- `id` (uuid) · `lead_id` TEXT · `page_id` TEXT · `form_id` TEXT · **`raw_payload` JSONB** ·
  `order_id` uuid · `status` TEXT · `error_message` TEXT · `created_at` timestamptz.

### C) 🔴 Le payload brut Meta est-il conservé ?

**OUI — colonne `meta_lead_logs.raw_payload` (JSONB)** — schéma `013…sql:99`, écrit `route.ts:64`.
**Précision importante** : `raw_payload` ne contient **que le `change.value` du webhook** =
`{ leadgen_id, page_id, form_id, ad_id, created_time }`. Il **ne contient PAS** les données
personnelles du lead (nom/téléphone/ville/réponses formulaire) — celles-ci viennent du 2ᵉ appel
Graph et ne sont **pas** stockées en brut.
- Pas de payload brut envoyé à **Sentry** ni logué : les `console.error` du webhook (`:28,:144,:153`)
  ne loggent pas le payload. Le lead PII stocké se limite donc à `clients` (nom, tel, wilaya).

---

## Q7 — Stockage du Page Access Token

- **User access token (long-lived, ~60j)** : table `meta_connections`, colonne **`access_token`**
  (TEXT NOT NULL) — `013…sql:36-44`. Écrit `exchange/route.ts:44-53`.
- **Page access token** : table `meta_page_subscriptions`, colonne **`page_access_token`**
  (TEXT NOT NULL) — `013…sql:69-78`. Écrit `exchange/route.ts:70-79`.
- **Chiffrement : NON. Tokens EN CLAIR (TEXT).** Aucun `encrypt/cipher/pgcrypto/pgsodium` dans
  `src/` ni dans les migrations (grep négatif). RLS restreint l'accès (service_role + owner), mais la
  valeur elle-même n'est pas chiffrée au repos.
- **Expiration / refresh** : `expires_in` est **reçu** (`meta.ts:57-68`) mais **JAMAIS persisté** —
  aucune colonne `expires_at`/`expires_in` dans `013…sql`. **Aucun refresh automatique** (aucun cron
  dédié). Le seul mécanisme : détection du code 190/OAuthException → `META_AUTH_EXPIRED`
  (`subscribe/route.ts:38-41`) → l'app demande une reconnexion manuelle.
- **Variables d'env** (jamais imprimées ici) : `META_APP_ID`, `META_APP_SECRET` (`meta.ts:31-32,
  47-48, 62-63`), `META_VERIFY_TOKEN` (`route.ts:14`).

---

## Q8 — Rétention

**AUCUNE RÉTENTION CODÉE.** Grep négatif sur `ttl|retention|purge|DELETE FROM.*lead|pg_cron|
expires_at|delete_after`.
- Crons existants (`vercel.json`) : `yalidine-poll` et `billing-reminders` — **aucun** ne purge de
  leads.
- Aucun DELETE programmé sur `meta_lead_logs`, `clients` (source lead), ou `orders` (source lead).
- **Seule suppression = action manuelle du vendeur** via `POST /api/meta/disconnect`
  (`disconnect/route.ts:30-31`) — mais elle ne supprime **QUE** `meta_page_subscriptions` +
  `meta_connections` (tokens). Elle **NE supprime NI** `meta_lead_logs`, **NI** les `clients`/`orders`
  issus des leads. → **Les données personnelles de leads persistent indéfiniment**, même après
  déconnexion Meta.

---

## CE QUI MANQUE POUR L'APP REVIEW `leads_retrieval` — classé par ordre de blocage

**BLOQUANT (empêche la soumission / motif de rejet quasi certain)**

1. **Politique de confidentialité déclarant les champs de lead.** Le code stocke aujourd'hui, comme
   PII de lead : **nom (`full_name`), téléphone (`phone`/`phone_normalized`), wilaya (`wilaya`)** dans
   `clients` ; et `leadgen_id/page_id/form_id/ad_id/created_time` dans `meta_lead_logs.raw_payload`.
   La politique doit lister **exactement** ces champs, où ils vivent (Supabase Postgres) et combien de
   temps. **Rien de tout ça n'est écrit** → à rédiger avant soumission. (Décision produit, pas code.)
2. **Rétention = "indéfini" → généralement rejeté.** Aucun TTL/purge (Q8). Il faut soit coder une
   rétention, soit la déclarer et l'assumer. `disconnect` ne purge pas les leads → à décider.

**FORT (Meta le regarde, recommandé avant review)**

3. **Scopes hors de ce repo (Q4).** Impossible de prouver ici que `leads_retrieval` est demandé —
   c'est dans `~/livra-mobile`. À vérifier/verrouiller côté mobile avant la vidéo E2E.
4. **Tokens en clair (Q7).** Meta recommande le chiffrement au repos des Page Access Tokens. Non
   bloquant strict, mais souvent soulevé.
5. **`expires_in` non persisté + pas de refresh (Q7).** Reconnexion réactive uniquement (après
   erreur 190). Risque de fenêtre où le webhook reçoit mais `getLeadData` échoue (token mort) → lead
   loggé en `error`. À anticiper pour la fenêtre de review (le webhook DOIT recevoir pendant la review).

**À SURVEILLER (opérationnel, pas un blocage review)**

6. **`META_APP_SECRET` absent → 200 silencieux (Q2).** Vérifier que le secret est présent en prod
   sinon tous les leads sont silencieusement perdus.
7. **Réponses de formulaire non stockées (Q6).** `getLeadData().raw` (toutes les questions du form)
   n'est pas persisté. Si le produit business a besoin d'autres champs du formulaire, ils sont
   aujourd'hui perdus. À arbitrer (mais ça **réduit** la surface PII, ce qui est plutôt bon pour la
   review).

---

## PÉRIMÈTRE — ce que cette commande aurait pu rater (auto-critique)

- Les **scopes OAuth** ne sont pas dans ce repo : la liste de la commande supposait implicitement
  qu'ils y étaient. **Faux.** Ils sont dans `~/livra-mobile`. Signalé (Q4).
- Le **payload brut** conservé (`raw_payload`) ne contient PAS le PII du lead, contrairement à ce que
  la formulation de Q6 pouvait laisser croire. Le PII vient d'un 2ᵉ appel Graph non persisté en brut.
- `disconnect` supprime les tokens mais **pas** les leads — écart de rétention non évident depuis la
  seule lecture de la migration.
