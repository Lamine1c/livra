# TEMPLATES_A_SOUMETTRE.md — templates WhatsApp à créer côté Meta (Lamine soumet)

## 🟢 ÉTAT FINAL DES SOUMISSIONS — 16 sept 2026 (N12-3)

Les templates du tunnel ont été soumis à Meta le 15 sept, en variantes **MONOLINGUES** (leçon : Meta
rejette les corps bilingues) et plusieurs corps ont été **reformulés** à la soumission (anti-classifieur).
Le corps qui part hors fenêtre 24h = **celui stocké CHEZ META**, PAS le body bilingue du code
(`whatsapp-templates.ts`, qui ne sert qu'au rendu texte-libre in-window). Aucun impact d'ENVOI
(`buildTemplatePayload` n'envoie que les variables `{{n}}` + `name`/`language`).

| Template | Langues soumises | Catégorie | Divergence vs corps bilingue du code |
|---|---|---|---|
| `order_confirmed_verified` | fr **et** ar | UTILITY | corps soumis **SANS** « servis en priorité » |
| `order_otp_wrong_code` | fr **et** ar | UTILITY | — (reformulation mineure possible) |
| `order_reschedule_request` | fr **et** ar | UTILITY | corps soumis avec « pour votre livraison » |
| `order_cancelled_mind_changed` | fr **et** ar | UTILITY | pur constat d'annulation : « votre commande chez {{2}} est bien annulée. Vous n'avez rien à payer. » — variables {{1}}+{{2}} |
| `order_cancel_reasons` | **ar UNIQUEMENT** | UTILITY | fr **REFUSÉ** (boutons darija sur corps FR). `code.language` mis à `"ar"` (N12-2). |
| `order_objection_cheaper` | (approuvé) | **MARKETING** (assumé) | catégorie MARKETING, pas UTILITY |
| `order_otp_code` | **NON soumis** | (Authentication forcée) | Meta force la catégorie Authentication → voir « order_otp_code v2 » en fin de fichier (N12-4) |

⚠️ **Conséquence code** : ne PAS supposer que `TEMPLATES.<name>.body` == le corps délivré hors fenêtre.
Pour toute vérif de copy hors fenêtre, se référer au **Meta Business Manager** (source de vérité des corps soumis).

---

> Écrit par cc (N1.2). **cc ne soumet RIEN à Meta** (interdit). Ce fichier = la spec de
> soumission. Le **corps exact (verbatim, AR-d'abord/FR-après ━━━) est la source de vérité
> dans `src/lib/whatsapp-templates.ts`** — copie-le tel quel à la soumission (n'y retape pas
> la darija à la main). Ici : nom, catégorie, langue, variables (ordre `{{1}}…`), boutons.

## Pourquoi (dette « hors fenêtre 24h »)

Les 7 messages du tunnel partent aujourd'hui en **texte libre / interactif** → délivrés
**uniquement dans la fenêtre 24h** (réponse à un message entrant de l'acheteur). C'est le cas
normal (ce sont des réponses). Mais `sendTunnelMessage` (`src/lib/whatsapp.ts`) bascule sur le
**TEMPLATE approuvé** si Meta refuse pour fenêtre fermée (code 131047 / 470). **Tant que ces
templates ne sont pas approuvés, le repli échoue proprement** (loggé, non bloquant) — il faut
donc les soumettre pour fermer la dette. `language.code` envoyé par le code = **`fr`** (champ
`language` de chaque template) — soumets-les en **French (fr)**, sinon le repli est rejeté.

## Les 7 templates du tunnel (tous `category: UTILITY`, `language: fr`)

| name | variables (ordre) | boutons (QUICK_REPLY, ≤20 chars) |
|---|---|---|
| `order_otp_code` | `{{1}}` = code OTP | — |
| `order_confirmed_verified` | (aucune) | — |
| `order_otp_wrong_code` | (aucune) | — |
| `order_cancel_reasons` | (aucune) | `ماشي اليوم` · `بدلت رايي` · `لقيت أرخص` |
| `order_reschedule_request` | (aucune) | — |
| `order_cancelled_mind_changed` | `{{1}}` = prénom, `{{2}}` = boutique | — |
| `order_objection_cheaper` | (aucune) | `إيه / OUI` · `لا / NON` |

**Boutons quick-reply** : à la soumission Meta, le **payload** de chaque bouton doit être son
`id` (`not_available` / `changed_mind` / `found_cheaper` pour `order_cancel_reasons`) OU son
libellé — le routage inbound (`confirm-order.ts`) matche sur le **libellé darija** renvoyé, donc
garde les libellés EXACTEMENT tels qu'en base de code.

**Corps** : copie `TEMPLATES.<name>.body` depuis `src/lib/whatsapp-templates.ts` (inclut la
signature LIVRA FR+AR ajoutée en N1.4 et le proverbe FR de `order_objection_cheaper` ajouté en
N1.3 — soumets APRÈS ces commits pour capter la copy finale).

## Hors tunnel mais même dette (business-initiated → souvent hors fenêtre) — à surveiller

Repérés au grep, NON câblés sur `sendTunnelMessage` ce tour (hors périmètre N1) :
- `src/app/api/orders/[id]/cancel-carrier/route.ts:80` — texte libre « Le mode de livraison… » → acheteur.
- `src/app/api/driver/cancel-delivery/route.ts:162` — texte libre → acheteur.
Ces deux-là partent hors d'une réponse client → **échouent hors fenêtre 24h aujourd'hui**. À
traiter dans un lot ultérieur (template dédié) — signalé, non corrigé (périmètre = tunnel).

## MSG 1 — forme finale à re-soumettre (spec N1.5, ZÉRO code)

> `order_confirmation_request` est **approuvé en prod** → cc ne touche PAS son code (STOP SI).
> Ceci est la **forme cible à re-soumettre** quand Lamine décidera de la mettre à jour. Le seul
> ajout vs la version prod = la **couche de confiance (Trust Layer) neutre** en pied, FR+AR
> (mêmes lignes que la signature LIVRA N1.4), pour cohérence avec le reste du tunnel.
>
> ⚠️ **D4 (séparer prix produit / livraison / total) N'EST PAS tranchée** → on garde **UN SEUL
> total** `{{4}}`. Ne PAS ajouter de slots prix-produit/prix-livraison tant que D4 n'est pas décidée.

- **name** : `order_confirmation_request` · **category** : `UTILITY` · **language** : `fr`
- **variables** (ordre inchangé) : `{{1}}`=prénom · `{{2}}`=boutique · `{{3}}`=produit · `{{4}}`=**total unique**
- **boutons** (inchangés) : `✅ إيه / OUI` · `❌ لا / NON`
- **body cible** (Trust Layer neutre en pied — slot neutre, aucune promesse chiffrée) :

```
message en français suit

سلام {{1}} 👋
كوموند تاعك عند {{2}} محجوزة باسمك.

🛍️ {{3}}
💰 ‪{{4}}‬ دج
📦 الخلاص عند التوصيل · ما تخلص والو دروك

تحب نبداو التوصيل ؟

✓ LIVRA — مقامك الخاص بك يحميك و يعطيك الأولوية في جميع متاجر LIVRA

━━━━━━━━━━━━━━

Bonjour {{1}} 👋
Bonne nouvelle : votre commande chez {{2}} est réservée à votre nom.

🛍️ {{3}}
💰 {{4}} DA
📦 Paiement à la livraison · rien à payer maintenant

Voulez-vous procéder à la livraison ?

✓ LIVRA — ton statut client te protege et te priorise dans toutes les boutiques LIVRA
```

**Slots Trust Layer neutres** = la ligne `✓ LIVRA — …` (FR/AR). « Neutre » : elle affirme le
statut/priorité du client sans chiffre ni promesse de délai — rien à re-valider si le barème de
score évolue. Si un jour D4 est tranchée « prix séparé », alors seulement : remplacer la ligne
`💰 {{4}}` par 3 lignes (produit `{{4}}` / livraison `{{5}}` / total `{{6}}`) et re-décaler les
variables — **hors périmètre tant que D4 n'est pas décidée**.
