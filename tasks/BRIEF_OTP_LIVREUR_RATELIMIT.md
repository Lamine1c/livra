# BRIEF cc — LE RATE LIMIT OTP LIVREUR BLOQUE 19 MIN AU LIEU DE 1 (30 juil, gate)

> Repo `~/livra`. **Bloque le gate de Lamine.** Antérieur au tour 7.

## 🔴 P1 — LE BLOCAGE DURE 19 MINUTES, LE MESSAGE DIT 1 MINUTE
`src/app/api/drivers/register/route.ts:45-58`
```ts
// 3. Rate limit : OTP envoyé il y a moins de 1 minute
.gt("expires_at", new Date(Date.now() - 9 * 60 * 1000).toISOString())
...
{ error: "Attends 1 minute avant de renvoyer." }, { status: 429 }
```
L'OTP est créé avec `expires_at = now + 10 min` (l.69). La condition `expires_at > now - 9min` reste
vraie **19 minutes** après la création (10 de vie + 9 de marge).
→ **Un signe : `- 9 min` au lieu de `+ 9 min`.** Avec `+`, la condition ne serait vraie que si l'OTP
a été créé il y a **moins d'une minute** — l'intention écrite en commentaire.

⚠️ **Vérifier le même motif dans `resend-otp/route.ts`.**

## 🔴 P2 — UN PREMIER ENVOI NE DOIT JAMAIS ÊTRE BLOQUÉ (Lamine)
« Un livreur n'a rien à renvoyer. » Il scanne un QR, remplit le formulaire, et se prend un message
de **renvoi** alors qu'il n'a jamais rien demandé. Le rate limit doit distinguer **premier envoi** et
**renvoi**, et le message doit dire le temps réel restant, pas un chiffre fixe.

## 🔴 P3 — UN LIVREUR DÉJÀ INSCRIT N'EST PAS RECONNU
Constaté au gate : après un retour au hub, l'app ne reconnaît plus le livreur comme déjà inscrit et
lui redemande de scanner le QR d'embauche. Le device token est pourtant en SecureStore
(`livra_device_token`, posé par `verify-otp`).
→ **Investiguer avant de coder** : d'où vient la perte de reconnaissance (token absent, route qui ne
le lit pas, chemin de retour qui repart du formulaire) ? Rapporter avant de toucher au flow.

## 🟡 P4 — « IMPOSSIBLE DE RENVOYER LE CODE » AU SCAN DU QR D'EMBAUCHE (settings vendeur)
Le QR d'embauche depuis les réglages vendeur renvoie cette erreur, alors que le QR de commande
fonctionne et mène bien au formulaire. Probablement le même 429 mal remonté (F8 : ne jamais afficher
une erreur serveur brute, mais ici le message est trompeur).

## RÈGLE
Branche dédiée. Push, ne pas merger. **Prioriser P1 : Lamine est bloqué pour gater.**

---

# AJOUT — GATE DU 30 JUIL (suite)

## 🔴 P5 — LE SUIVI ACHETEUR CONTINUE APRÈS UNE ANNULATION
Constaté : un lien de suivi d'une commande **annulée** permet toujours de **localiser le livreur**,
alors qu'il n'a plus aucune livraison en cours.

**Cause** : `src/components/track/moto-perso-tracker.tsx:28`
```ts
if (orderStatus === "delivered" || deliveryStatus === "completed") return "Livré";
```
→ Depuis le **tour 3**, une annulation livreur met la commande en **`returned`** (et la delivery en
`cancelled`). **Aucun des deux n'est reconnu par le tracker** — il continue d'afficher la position.

**Fix** : le suivi doit se terminer sur `returned` (commande) **et** `cancelled` (delivery), avec un
état de fin lisible pour l'acheteur. Vérifier aussi la coupure du polling (`:136` ne gère que
`delivered` / `cancelled` côté commande).
⚠️ **Enjeu** : c'est la position d'un livreur qui reste exposée à un acheteur qui n'a plus de colis
en route. Ce n'est pas qu'un défaut d'affichage.

## 🔴 P6 — ANNULATION : L'ACHETEUR EST NOTIFIÉ, LE VENDEUR NON
Constaté : annulation pour panne → **WhatsApp acheteur reçu** · **rien côté vendeur**, la commande
reste sur « prise en charge » (`processing`) au lieu de `returned`.
→ **À investiguer avant de coder** : `cancel-delivery` a manifestement tourné (le WhatsApp part
depuis là), mais ni le statut ni le push n'ont suivi. Vérifier l'ordre des opérations et les chemins
d'échec silencieux. **Rapporter le diagnostic à Lamine avant toute modification.**

## ⚠️ NOTE DE GATE — P3 ET P4 NON TESTABLES SUR LE ZTE
Le ZTE tourne sur l'**APK du 27 juillet**. Les fixes P3 (nav) et P4 (clavier) datent du 30 et n'y
sont pas. **Ils seront re-gatés sur l'iPhone 15 en compte vendeur** (Metro, code à jour).
→ Prévoir un **nouvel APK** pour le ZTE avant tout gate vendeur sur Android.

## ✅ VALIDÉ AU GATE DU 30 JUIL
**P1 beacon** : s'éteint en 45-50 s en mode avion sans bouger, se rallume seul en ~25 s au retour du
réseau. **Le heartbeat fonctionne dans les deux sens.**
**P2 (partiel)** : le lien de suivi acheteur s'ouvre correctement sur la preview.
