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

**Ce dont j'ai besoin (décision Lamine)** : la **rétention des leads** — on code une purge (quelle durée ?)
ou on l'assume telle quelle dans la politique ? C'est le seul arbitrage qui débloque la rédaction de la
politique de confidentialité, donc la vidéo E2E, donc la soumission. (Détail + priorisation complète dans
`tasks/AUDIT_LEADS_META.md`, section « CE QUI MANQUE ».)
