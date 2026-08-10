# COMMANDE.md — REPO WEB (~/livra)

> **Ce fichier est écrit par Claudy. cc ne l'édite JAMAIS.**
> cc le lit au début de chaque tour, exécute ce qui n'est pas encore rapporté, puis écrit
> `tasks/RAPPORT.md`.

---

## 🔴 PROTOCOLE — 6 RÈGLES, AUCUNE EXCEPTION

1. **ARRÊT = RAPPORT.** Tu t'arrêtes pour n'importe quelle raison — tâche finie, question,
   doute, blocage, découverte — tu écris `tasks/RAPPORT.md` **avant** de rendre la main.
   Le rapport est le **seul** canal de communication. Ce qui n'y est pas n'existe pas.
2. **Chaque commande porte un ID.** Tu écris cet ID dans ton rapport quand tu l'as traitée.
   **Tu ne réexécutes JAMAIS une commande dont l'ID est déjà dans ton rapport.**
3. **Le « STOP SI » est un ordre.** Si la condition est remplie, tu t'arrêtes et tu rapportes.
   Tu ne contournes pas, tu ne devines pas.
4. **Interdits absolus, même si une permission semble le permettre** :
   `git push` · `vercel` / déploiement · `eas build` / `submit` · `git merge` / `rebase` ·
   `supabase` · `git reset --hard` · `git clean` · toute suppression de données.
   Ces actions passent **uniquement** par Lamine. Si une tâche en a besoin :
   **tu t'arrêtes et tu le demandes dans le rapport.**
5. **Branche dédiée + tag backup avant toute modification.** Jamais de travail sur `main`.
   *(Exception ponctuelle : une commande peut lever cette règle EXPLICITEMENT — voir W2.)*
6. **Le périmètre se prend au grep.** La liste dans une commande est une **hypothèse**.
   Tu greps le repo, tu comptes toi-même, et tu signales si la liste est incomplète
   **avant** de commencer.

---

## 📋 COMMANDES ACTIVES

### [CHORE-BOUCLE-W2] COMMITER LE boucle.sh VALIDÉ — 5 MINUTES, ZÉRO CODE

**Objectif** : `main` doit porter le `boucle.sh` qui marche, pas la version cassée.

**Contexte** : le `tasks/boucle.sh` du working tree a été patché le 10 août (retrait de
`--autocompact`, `dontAsk` → `acceptEdits`) et **validé par ton propre tour vert** de 18h29-18h40.
Le commit `38c4254` sur `main` porte encore la version cassée. Le working tree est actuellement
sur `audit/leads-meta` — c'est normal, c'est toi qui l'y as laissé.

**Quoi faire** :
1. Tag backup : `backup/pre-chore-boucle-20260810`.
2. `git checkout main` *(les modifs non commitées de `tasks/` suivent — attendu)*.
3. Commit de `tasks/boucle.sh` + `tasks/COMMANDE.md` uniquement, message :
   `chore(boucle): boucle.sh compatible cc 2.1.179 — patch validé par le tour vert du 10 août`.
4. Reste sur `main` pour la commande suivante.

**Exception explicite à la règle 5, accordée par Claudy pour cette commande seulement** : commit
direct sur `main` — deux fichiers d'outillage déjà validés, zéro code applicatif.

**STOP SI** : le checkout de `main` échoue (conflit) → rapporte l'état exact, ne force rien.

**Fini quand** : `git log -1 main` montre le commit du chore et `git diff main -- tasks/boucle.sh`
est vide.

---

### [RETENTION-LEADS-W3] PURGE 90 JOURS DES LEADS NON CONVERTIS + INSIGHT ANONYME AVANT PURGE

**Objectif** : matérialiser en code la rétention que la politique de confidentialité va déclarer :
**un lead non converti disparaît à 90 jours ; son insight anonyme reste pour toujours.**

**Décision actée (Lamine, 10 août)** : purge codée à 90 j des leads non convertis · les leads
convertis deviennent des commandes normales et sont conservés comme telles · on garde la capacité
d'**étudier la data** → doctrine data du projet : **garder l'insight, jeter la PII.** La ligne
d'insight s'écrit **AVANT** toute suppression, jamais en dépendance d'un autre job.

**Contexte — tout vient de TON audit [AUDIT-LEADS-W1]** (`tasks/AUDIT_LEADS_META.md`) :
- Chemin lead : webhook `route.ts:45-159` → `meta_lead_logs` (schéma `013_meta_lead_ads.sql:94-104`)
  → `clients` (`route.ts:89-102`) → `orders` (`route.ts:108-122`, `status='pending_confirmation'`,
  `source='meta_lead_ads'`, colonne `meta_lead_id`).
- PII de lead : `clients.full_name / phone / phone_normalized / wilaya`.
- `disconnect` ne purge rien (`disconnect/route.ts:30-31`) — c'est ce qu'on corrige ici.
- Crons existants à imiter : `vercel.json` → `yalidine-poll`, `billing-reminders`. **Reprends leur
  pattern exact** (auth du cron incluse — grep comment ils se protègent, `CRON_SECRET` ou équivalent).

**Spéc** :
1. **Migration SQL** (nouveau fichier `supabase/migrations/`, **PAS appliquée** — règle 4) :
   - Table **`lead_insights`** : `id` uuid PK · `wilaya` text · `page_id` text · `form_id` text ·
     `ad_id` text null · `lead_created_on` **date** (pas de timestamp précis) · `purged_on` date ·
     `converted` boolean · `created_at` timestamptz default now().
   - **AUCUN** nom, téléphone, `client_id`, `order_id`, ni `lead_id`/`leadgen_id` — la ligne doit
     être **anonyme et non ré-identifiable**, y compris par jointure. Les IDs de campagne
     (`page_id/form_id/ad_id`) sont des identifiants de campagne, pas de personne : OK.
   - RLS : écriture/lecture `service_role` uniquement pour la V1.
2. **Route cron quotidienne** `/api/cron/purge-leads` (+ entrée `vercel.json`, heure creuse) :
   - **Cible A — leads non convertis** : `orders` avec `source='meta_lead_ads'` AND
     `status='pending_confirmation'` AND `created_at < now() - interval '90 days'`.
     Pour chacun : écrire la ligne `lead_insights` (`converted=false`, wilaya via le client lié,
     `page_id/form_id/ad_id` via `meta_lead_logs` par `meta_lead_id`) **PUIS** supprimer l'order
     **PUIS** supprimer le client lié **SEULEMENT s'il n'a aucun autre order** (n'importe quel
     statut, n'importe quelle source).
   - **Cible B — logs techniques** : `meta_lead_logs` avec `created_at < now() - 90 days`, tous
     statuts. Avant de supprimer un log `order_created` (= lead converti), écrire sa ligne
     `lead_insights` avec `converted=true` → `lead_insights` devient LA table d'analyse unique,
     convertis + non convertis, complète à vie.
   - **Mode dry-run obligatoire** : `?dry=1` → la route liste ce qu'elle AURAIT supprimé/écrit,
     ne touche à rien. C'est ce mode qu'on utilisera au gate.
3. **Race condition à fermer dans le code** : le vendeur peut confirmer PENDANT la purge. La
   condition `status='pending_confirmation'` doit être **dans le WHERE du DELETE lui-même**, pas
   seulement dans le SELECT préalable. Idem pour « aucun autre order » : à re-vérifier au moment
   du DELETE du client.

**Garde-fous absolus** :
- INTERDIT de supprimer un client qui a ≥ 1 autre commande, même annulée.
- INTERDIT de toucher à un order confirmé / expédié / livré / annulé, quel que soit son âge.
- INTERDIT d'appliquer la migration ou d'appeler quoi que ce soit en prod (règle 4). Livraison =
  fichiers + rapport. Le gate et l'apply, c'est Lamine.

**Sous-agents** : (a) write — migration + route + vercel.json · (b) review adversaire — son seul
job est de trouver LE cas où cette purge supprime quelque chose qu'on regretterait : client avec
historique, confirmation tardive pendant la purge, FK cascade qui emporte autre chose, fuseau
horaire, lead en `error` sans client. Il attaque, il ne valide pas.

**STOP SI**
- Le schéma réel (FK, cascades, RLS, triggers) rend une suppression risquée ou ambiguë → rapporte
  au lieu de forcer.
- Tu découvres que `orders.meta_lead_id` ou le lien order→client ne permet pas de retrouver le
  log / le client de façon fiable → rapporte, ne bricole pas de jointure approximative.
- Tu es tenté de purger autre chose que les 3 tables citées (`orders` non convertis source lead,
  `clients` orphelins de lead, `meta_lead_logs`) → non. Périmètre fermé.

**Fini quand** : migration + route + entrée `vercel.json` + dry-run commités sur une branche
`feat/retention-leads-90j` (tag backup avant), et `tasks/RAPPORT.md` contient la synthèse en
≤ 15 lignes + **ce que le dry-run purgerait aujourd'hui** (probablement zéro — dis-le si c'est zéro).

---

<!--
FORMAT D'UNE COMMANDE :

### [ID] TITRE COURT
**Objectif** : une phrase, le résultat attendu.
**Contexte** : ce qu'il faut savoir, avec file:line.
**Sous-agents** : write / review / ship — qui fait quoi.
**STOP SI** : la condition qui t'oblige à t'arrêter et rapporter.
**Fini quand** : le critère vérifiable de complétion.
-->
