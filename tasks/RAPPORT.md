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

## [RETENTION-LEADS-W3] — BLOQUÉ (STOP SI déclenché) — 10 août 2026

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
