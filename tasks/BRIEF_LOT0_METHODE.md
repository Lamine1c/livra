# BRIEF cc — LOT 0 · LA MÉTHODE (31 juil)

> Plan complet : `~/livra-mobile/tasks/PLAN_PRODUCTION.md`. Audit source : `tasks/AUDIT_31JUIL.md`.
> **Zéro code applicatif. Zéro risque.** Objectif : que le prochain cc démarre avec une carte JUSTE.
> Claudy s'occupe en parallèle de `HANDOFF.md` et `BACKLOG.md` (repo mobile) — **n'y touche pas**.

---

## 🔴 P1 — LE REPO WEB NE LIT JAMAIS LE BACKLOG *(bug de méthode)*
`~/livra/CLAUDE.md:8-13` — le rituel de démarrage dit : « 1. CC_RAPPORT 2. HANDOFF 3. Ce fichier ».
**`BACKLOG.md` n'y est pas.** Le `CLAUDE.md` mobile, lui, le liste.

→ Or presque **tout le parké web** ne vit QUE dans `~/livra-mobile/BACKLOG.md` : page
`/livreur/rejoindre` (404), `/api/settings/yalidine/test`, trou du flow refus client, slice web
(webhook Meta + replay + `paid_until`), enforcement de l'abonnement.
**Un cc lancé côté web ne les voit jamais.**

**Fix** : ajouter `~/livra-mobile/BACKLOG.md` au rituel de démarrage du `CLAUDE.md` web, avec le
chemin absolu (c'est un autre repo).
**Au passage** : ses « SOURCES DE VÉRITÉ » pointent encore sur `LIVRA_ROADMAP.md`, que le projet
déclare périmé (« couches contradictoires, refonte au backlog »). → corriger l'ordre de vérité :
`BACKLOG.md` + `HANDOFF.md` d'abord, ROADMAP = historique horodaté seulement.

---

## 🔴 P2 — `CC_RAPPORT.md` EST RESTÉ AU 30 JUILLET
C'est **ta mémoire entre sessions** et la **lecture n°1** de toute session cc. Il affirme encore :
- « écran 8 Espace livreur : **mobile attend gate iPhone ⏳** »
- « TTL token livreur 24h→30 j … **NON mergé/déployé** — à déployer pour prendre effet »

**La réalité (vérifiée)** : `design/neumorph-driver` est **mergée dans `main`** (`c3bf5a5`, poussée) —
**écran 8 fermé, 8/8**. Le TTL 30 j est **déployé en prod** (`dpl_ATuVK7eVpvxAcJSffivbfZv71GBG`), et
le suivi acheteur P2+P5 aussi (`dpl_4CZoTMEuLjB87NkybpD67y7JqcZc`).

**Fix** : resynchroniser l'en-tête **et le corps**. ⚠️ C'est ton défaut récurrent — signalé 3 fois
cette semaine : tu mets l'en-tête à jour et tu laisses des blocs périmés plus bas. **Relis le fichier
en entier** et corrige tout ce qui contredit l'état réel.

---

## 🟡 P3 — TRANCHER LA CONTRADICTION SUR LE GATE ABONNEMENT
Deux docs disent l'inverse :
- `CC_RAPPORT.md:161` : « **Abonnement — 4/5 états NON GATÉS** … jamais vus par un humain »
- `HANDOFF.md` : « **4/5 états + écran de blocage confirmés au gate device** »

C'est l'écran qui décide si un vendeur non-payé revient — **le maillon du revenu**.
**Investigue et écris la vérité** : quels états ont réellement été vus sur device, lesquels non.
Si tu ne peux pas trancher depuis les traces, écris « **à re-gater** » plutôt que de choisir.
**Rapporte le verdict à Lamine.**

---

## 🟡 P4 — CODE TEMPORAIRE DONT LA CONDITION DE RETRAIT N'ARRIVERA JAMAIS
`LIVRA_ROADMAP.md:976` : l'inbound WhatsApp est gardé par `TWILIO_SANDBOX_MODE=1`, marqué
« **code TEMP à retirer à l'activation 360dialog** ».
**360dialog a été abandonné** (Meta-direct choisi) → **cette condition ne se produira jamais.**
→ **Investigue seulement** : ce garde-fou est-il encore dans le code ? Sert-il à quelque chose ?
**Ne supprime rien sans rapporter d'abord** — c'est sur le chemin du tunnel WhatsApp en prod.

---

## RÈGLE
Branche dédiée si tu touches du code, sinon commit direct sur `main` (c'est de la doc).
**Ne touche pas** à `~/livra-mobile/HANDOFF.md` ni `BACKLOG.md` — Claudy les traite en parallèle.
Rapporte P3 et P4 avant toute suppression.
