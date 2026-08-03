# BRIEF — VERROUILLER `/api/scan` (C6) · **AVANT le LOT 7**
> Source : `tasks/RAPPORT_SCAN_CRAWLER.md` + `AUDIT_31JUIL.md` C6. Décision : **Option B**.
> ⚠️ **Ordre non négociable** : ce brief passe **AVANT** que le LOT 7 crée la page `/scan`.
> Aujourd'hui la faille n'est pas atteignable parce que `/scan` fait 404 — c'est un accident,
> et le LOT 7 est précisément le lot qui supprime cet accident.

## 🎯 LE PROBLÈME EN UNE PHRASE
Un `GET /api/scan?t=<token valide>` — **sans aucune authentification** — fait avancer le statut de la
commande **et** renvoie nom + téléphone + adresse + **GPS du domicile** de l'acheteuse + les articles
+ les montants. Le paramètre `d` ne garde **que** la génération du token GPS.
→ Le crawler d'aperçu n'est que le cas le plus visible. Le vrai risque : **un token qui circule**
(lien transféré, screenshot de QR dans un groupe Facebook) = fuite PII complète.

## ✅ CE QU'ON FAIT — `src/app/api/scan/route.ts`
**Tout effet et toute PII passent derrière un driver authentifié.**

1. **`d` devient obligatoire.** Absent → `401` + `{ error: "DEVICE_REQUIRED" }`, **aucune PII,
   aucune mutation**. Sortie immédiate, avant même le SELECT commande si possible.
2. **Déplacer l'update de statut** (l.77-82, `update({status:"processing"})`) **À L'INTÉRIEUR** du
   bloc `if (driver?.id)` (l.65). Aujourd'hui il est au niveau racine — c'est le cœur du bug.
3. **La PII ne sort que si `driver?.id`.** Le payload `l.90-103` (`...order` + `buyer_*` +
   `vendorName`) est conditionné au driver résolu.

## 🔴 LA NUANCE QUI DÉCIDE DE TOUT — NE PAS CASSER LE RECRUTEMENT
Un livreur **pas encore inscrit** possède un `deviceId` local mais **aucune ligne `drivers`**.
Si on lui renvoie un 401 muet, l'app ne sait plus le router vers l'embauche → **on casse le canal
de recrutement en croyant boucher un trou**. Donc **trois réponses distinctes** :

| Cas | Réponse | PII | Mutation |
|---|---|---|---|
| `d` absent | `401` `DEVICE_REQUIRED` | ❌ | ❌ |
| `d` présent, **driver inconnu** | `401` **`UNREGISTERED`** | ❌ | ❌ |
| `d` présent, driver résolu | `200` (comportement actuel) | ✅ | ✅ |

Le code `UNREGISTERED` est ce qui permet à `(driver)/scan.tsx` de router vers l'embauche.
**Vérifier d'abord** ce que le mobile fait aujourd'hui d'un `deviceToken: null` — si c'est ce
qui déclenche le routage vers `/rejoindre`, il faut adapter le mobile **dans le même chantier**,
sinon un livreur neuf tombe dans le vide. Le mobile est un **second commit, repo `~/livra-mobile`**.

## 📐 CONTRAINTES
- Branche dédiée `fix/scan-lockdown` off `main`. Tag `backup/pre-scan-lockdown`.
- **Ne PAS créer de page `/scan`** — c'est le LOT 7, et il vient après.
- Ne pas toucher `verifyQrToken` ni `qr-token.ts`. Le HMAC est correct, ce n'est pas le sujet.
- `tsc` + `build` verts. Push sans merger.

## 🚦 GATE
1. `curl` sur `/api/scan?t=<token valide>` **sans `d`** → `401`, **zéro donnée acheteur dans la
   réponse**, et le statut de la commande **inchangé en base** (vérifier les deux).
2. Même `curl` avec un `d` bidon → `401 UNREGISTERED`, zéro PII, statut inchangé.
3. **Vrai scan depuis l'app** avec un livreur inscrit → inchangé, la commande passe `processing`.
4. **Vrai scan depuis un téléphone dont le livreur n'est PAS inscrit** → il arrive bien sur
   l'embauche, pas sur une erreur. **C'est le point qui casse si on bâcle.**
