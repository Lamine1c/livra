# BRIEF cc — MERGER + DÉPLOYER LES 3 FIXES DU GATE (28 juil)

> Repo : `~/livra`. Décisions produit tranchées par Lamine ce jour (voir §DÉCISIONS).

---

## POURQUOI ON MERGE AVANT DE GATER (entorse assumée, 2e fois)

**Les 3 fixes sont ingatables en preview :**
- `otp-wrong-code-reply` et `confirmation-muette` se déclenchent sur un **message WhatsApp entrant**.
  Le webhook Meta pointe sur `golivra.app` → **une preview ne recevra jamais de message entrant.**
- `course-fantome` passe par l'app mobile, qui tape `EXPO_PUBLIC_API_BASE=https://golivra.app` **en dur**.

→ Gate en prod, après merge. Ce qui rend l'entorse acceptable :
- les 3 diffs sont **petits, additifs et confinés au tunnel déjà cassé** ;
- `otp-wrong-code` et `confirmation-muette` **n'ajoutent que des envois best-effort** — aucun chemin
  existant n'est modifié ;
- `course-fantome` **resserre une garde** : le seul chemin qu'il change répondait 200 sur une course
  morte. On ne peut pas casser ce qui ne marchait pas.

---

## ⚠️ LE PIÈGE À CONNAÎTRE AVANT DE MERGER
`fix/otp-wrong-code-reply` **et** `fix/confirmation-muette-push-vendeur` modifient **le même fichier** :
`src/lib/confirm-order.ts` (+8 lignes pour l'un, +24/-2 pour l'autre).
Les zones sont proches : l'un touche le bloc `if (!match)` (~l.103), l'autre le `SELECT` (~l.82) et
le bloc après l'update (~l.108+). **Conflit possible.** Si conflit : garder **les deux** ajouts,
ils sont indépendants — le message d'erreur acheteur ET le push vendeur.

Les 3 branches partent de `ac3676f` ; `main` est à `b0c75b3` (commit docs). Elles sont donc en
retard d'un commit — sans danger pour un merge, mais **mets-les à jour avant de builder** pour que
tsc/build tournent sur l'état final réel.

---

## LES ÉTAPES

### 0. Filet
```
cd ~/livra && git tag backup/pre-3fixes-28juil main
```

### 1. Merger dans cet ordre (du plus isolé au plus conflictuel)
```
git checkout main
git merge --no-ff fix/course-fantome-start-delivery        # start-delivery + complete-delivery, isolé
git merge --no-ff fix/otp-wrong-code-reply                 # confirm-order + whatsapp-templates
git merge --no-ff fix/confirmation-muette-push-vendeur     # confirm-order + push-messages ← conflit possible
```

### 2. Vérifier avant de pousser
```
npx tsc --noEmit && npm run build
```
Puis contrôle que les 3 comportements coexistent bien dans `src/lib/confirm-order.ts` :
- `user_id` présent dans le `SELECT` de `confirmOrderByInboundCode`
- sur `wrong_code` → envoi du message acheteur
- après l'update → push vendeur `orderConfirmed`

**Si le build casse ou qu'un des trois a disparu au merge : STOP, `git reset --hard backup/pre-3fixes-28juil`, et signale.**

### 3. Pousser + déployer
```
git push origin main
npx vercel --prod
```
Attendre `● Ready`, puis noter le deployment ID dans ton rendu.

### 4. Vérif post-deploy (à faire, ne pas sauter)
```
git show main:src/app/api/driver/start-delivery/route.ts | grep -c "DELIVERY_CANCELLED"
git show main:src/lib/confirm-order.ts | grep -c "orderConfirmed"
```
Les deux doivent renvoyer ≥ 1.

---

## DÉCISIONS PRODUIT TRANCHÉES PAR LAMINE (28 juil) — à graver, ne pas rouvrir

1. **`orders.picked_up_at` n'est PAS remis à `null` à l'annulation.** Il garde la trace du premier
   départ. Une commande annulée passe `returned` : elle ne repart pas sans décision du vendeur.
   La réassignation reste la feature « relancer ».
2. **Statuts qui méritent un push vendeur : 4 seulement** — commande **confirmée** · course
   **démarrée** · **livrée** · **annulée**. Tout notifier = bruit → le vendeur coupe les notifs →
   on perd le canal.
3. **Numéro entrant vs formulaire (inscription livreur) : l'ENTRANT fait foi.** C'est le seul
   vérifiable, et c'est par lui que passeront toutes les communications ensuite.

⚠️ **Ne code PAS ces décisions dans ce brief** — elles sont notées pour les chantiers suivants.
Ce brief ne fait que merger + déployer l'existant.

---

## APRÈS TON RENDU
Lamine gate **en prod**, avec une **commande fraîche**, sur les 3 appareils
(ZTE vendeur · iPhone 15 livreur · iPhone 12 acheteur WhatsApp).
Ne merge rien côté mobile : `design/neumorph-driver` attend son gate.
