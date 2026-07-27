# BRIEF cc — 🔴 L'OTP QUI ÉCHOUE EN SILENCE (27 juil, trouvé au gate)

> Repo : `~/livra` (web). **Bug de prod, antérieur au tour 4.**
> Trouvé en réel par Lamine : l'acheteur s'est trompé **d'un chiffre** sur l'OTP.
> Résultat : **aucune réponse**, la commande reste bloquée, personne ne sait pourquoi.

---

## LA PREUVE

`src/lib/confirm-order.ts:102-105`
```ts
const match = sameNumber.find((o) => o.otp_code === code);
if (!match) {
  console.log(`[whatsapp/inbound] from=${masked} no-match (code incorrect, ${sameNumber.length} order(s) en attente)`);
  return { matched: false, reason: "wrong_code" };
}
```
Un `console.log`, un `return`. **Aucun message n'est envoyé à l'acheteur.**
Et `src/app/api/whatsapp/inbound/route.ts` **ne consomme pas le `reason`** — le résultat est jeté.

**Confirmé par les logs Vercel du 27 juil :**
```
20:08:29  POST /api/whatsapp/inbound  → POST graph.facebook.com/messages   (le OUI : LIVRA répond, envoie l'OTP)
20:08:40  POST /api/whatsapp/inbound  → AUCUN POST vers Meta               (le code faux : silence)
```
Dans les deux cas : `GET orders`, jamais de `PATCH orders`. Le second est un mur.

---

## POURQUOI C'EST CRITIQUE

L'acheteur tape 6 chiffres à la main, sur un clavier de téléphone, en faisant autre chose.
**Se tromper est le cas NORMAL, pas le cas limite.**

Aujourd'hui, quand ça arrive :
- l'acheteur ne sait pas qu'il s'est trompé — il croit avoir confirmé et attend son colis
- il ne sait pas qu'il peut réessayer, ni comment
- le vendeur voit « à confirmer » et attend
- la commande meurt sans que personne ne comprenne

**Cette perte est invisible pour le score** : aucune annulation, aucun refus, aucune trace.
Elle ne ressemble à rien dans les données. C'est le pire type de perte pour LIVRA — le moat
repose sur la confirmation, et la confirmation a un mur silencieux au milieu.

---

## LE FIX

**Répondre à l'acheteur sur `wrong_code`, et UNIQUEMENT sur `wrong_code`.**

### Pourquoi seulement ce cas
| reason | Répondre ? | Pourquoi |
|---|---|---|
| `wrong_code` | ✅ **OUI** | Le numéro a bien une commande en attente. C'est un vrai client qui se trompe. Il DOIT le savoir. |
| `no_pending_order` | ❌ non | Aucune commande pour ce numéro. Répondre = parler à un inconnu, bruit et risque de spam. |
| `not_a_code` | ❌ non | Message quelconque, pas une tentative de confirmation. |
| `db_error` | ❌ non | Problème interne, on n'expose rien à l'acheteur. |

### Contraintes techniques
- **Message texte simple dans la fenêtre 24 h Meta** — autorisé **sans template approuvé**
  (l'acheteur vient d'écrire, la fenêtre est ouverte par définition). Le même mécanisme que
  le MSG 4 déjà utilisé. Pas de soumission Meta, pas d'attente.
- **Best-effort** : si l'envoi échoue, logue et continue — ne jamais faire échouer le webhook
  (Meta le rejouerait en boucle).
- **FR + AR**, selon la locale de la commande, comme les autres messages du tunnel.
  ⚠️ **Ne jamais afficher d'anglais à un acheteur DZ.**

### Le texte — à faire valider par Lamine avant de committer
C'est du copy terrain, pas de la technique. Le sens attendu : dire que le code ne correspond
pas, et que l'acheteur peut **renvoyer le bon code** — sans le culpabiliser, sans jargon.
Proposer 2 formulations FR + leur AR, laisser Lamine trancher.

⚠️ **Ne PAS écrire « il vous reste N essais »** tant que la limite d'essais n'existe pas
(voir ci-dessous) — on ne promet pas une mécanique qu'on n'a pas.

---

## ⚠️ QUESTION DE SÉCURITÉ À REMONTER (ne pas coder sans accord)
Aujourd'hui, **aucune limite au nombre de tentatives d'OTP par WhatsApp**. Un code à 6 chiffres
sans plafond est brute-forçable. Le risque réel est faible (il faut connaître un numéro qui a
une commande en attente, dans la fenêtre d'expiration), mais **ajouter un message d'erreur
rend la mécanique lisible et donc plus facile à sonder**.
→ Signale-le à Lamine. Un compteur de tentatives par commande serait la réponse propre.
**Décision produit, pas technique. Ne rien coder ici.**

---

## VÉRIFICATION APRÈS FIX
1. Commande fraîche, envoi de l'OTP.
2. Répondre avec un **code faux** → l'acheteur doit recevoir le message d'erreur, la commande
   reste « à confirmer ».
3. Répondre avec le **bon code** dans la foulée → la commande passe `confirmed`.
   **Le premier échec ne doit pas bloquer le second essai.**
4. Envoyer un message quelconque depuis un numéro **sans commande** → **aucune réponse**.

## RÈGLE DE TRAVAIL
Branche dédiée sur `~/livra`, pas sur `main`. Ne pas mélanger avec
`fix/course-fantome-start-delivery` : deux bugs distincts, deux branches, deux gates.
