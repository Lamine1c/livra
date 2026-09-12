# TEMPLATES_A_SOUMETTRE.md — templates WhatsApp à créer côté Meta (Lamine soumet)

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

## MSG 1 — forme finale (spec N1.5, ci-dessous)

_(section ajoutée par le livrable N1.5)_
