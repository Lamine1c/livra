# BRIEF cc — 🔴 LA COURSE FANTÔME (27 juil) — BUG DE PROD, PAS DU TOUR 4

> Trouvé au gate device par Lamine, confirmé par les logs Vercel + le code + la base.
> **Ce bug est ANTÉRIEUR au tour 4** — aucun commit d'aujourd'hui ne l'a introduit.
> Repo concerné : `~/livra` (web). Le mobile n'est PAS en cause.

---

## LE SYMPTÔME OBSERVÉ
Lamine rescanne le QR d'une commande dont la course a été démarrée **et annulée hier**.
L'app entre normalement dans l'écran « livraison en cours ». Il annule pour accident/panne.
Le livreur revient au hub, **le vendeur ne reçoit rien**, le statut de la commande ne bouge pas.

**En base : aucune delivery créée aujourd'hui, `delivery_refusals` vide.**
**Dans les logs Vercel : tous les appels ont pourtant réussi.**
```
18:38:25  POST 200  /api/driver/start-delivery
18:38:26  POST 409  /api/driver/position        ← ×2
18:39:30  POST 200  /api/driver/cancel-delivery
```

Un serveur qui répond 200 et n'écrit rien. Voici pourquoi.

---

## LA CHAÎNE — 3 MAILLONS, TOUS « CORRECTS » ISOLÉMENT

### ① `src/app/api/driver/start-delivery/route.ts:41-47`
```ts
// Idempotence: if picked_up_at is already set, the delivery was already started + WA sent
if (orderCheck?.picked_up_at) {
  const { data: existingDelivery } = await supabase
    .from("deliveries").select("id").eq("order_id", orderId).maybeSingle();
  return NextResponse.json({ deliveryId: existingDelivery?.id, alreadyStarted: true });
}
```
→ **Le statut de `existingDelivery` n'est JAMAIS regardé.** Une delivery `cancelled` est
rendue au livreur comme si elle était vivante, avec un **200**.

### ② `src/app/api/driver/position/route.ts:49-50`
```ts
if (delivery.status === "completed" || delivery.status === "cancelled") {
  return NextResponse.json({ error: "Delivery already closed" }, { status: 409 });
}
```
→ **C'est le 409 des logs.** Le serveur refuse la position d'une course qu'il vient
lui-même de rendre. Il se contredit à une seconde d'intervalle.

### ③ `src/app/api/driver/cancel-delivery/route.ts:62-65`
```ts
// Idempotent: already cancelled
if (delivery.status === "cancelled") {
  return NextResponse.json({ ok: true });
}
```
→ **200 sans rien écrire** : pas de `deliveries.update`, pas de `orders.status='returned'`,
pas de push vendeur, pas de WhatsApp acheteur, pas de ligne `delivery_refusals`.
Côté mobile, `response.ok` est vrai → l'app retourne au hub, comme après un vrai succès.

**Chaque garde est défendable isolément. Ensemble ils fabriquent une course fantôme.**

---

## 🔴 POURQUOI C'EST GRAVE EN PROD (pas un artefact de test)

Le chantier **« accident/panne → relancer un autre livreur »** (déjà au `BACKLOG.md`) tombe
exactement là-dedans. La course est annulée, le vendeur envoie le lien à un autre livreur,
celui-ci scanne le **même QR** → il entre dans une course fantôme.

Il roule. Il livre. Il encaisse le COD. Il marque « livrée ».
**Rien ne s'écrit.** Le vendeur voit sa commande en attente, l'acheteur n'a aucune notif,
le colis est chez lui et le cash est chez le livreur.

**Sur un marché 95 % COD, c'est de l'argent qui disparaît du système.**

→ **La feature « relancer » est inconstruisible tant que ce trou existe.**

---

## LE FIX V1 — REFUSER PROPREMENT, NE PAS RÉASSIGNER

**Décision Lamine : en V1, `start-delivery` REFUSE une course close. Il ne réassigne pas.**
La réassignation (créer une nouvelle delivery) est la feature « relancer » du backlog, qui
demande un choix vendeur explicite — on ne la préempte pas ici.

### Dans `start-delivery`, remplacer le court-circuit `picked_up_at` par un switch sur le STATUT

Récupérer la delivery **la plus récente** de la commande (voir le piège ci-dessous), puis :

| Statut trouvé | Comportement attendu |
|---|---|
| `active` | **Renvoyer le `deliveryId`** — c'est la récupération après crash, comportement légitime existant. Ne rien changer ici. |
| `cancelled` | **409** + code d'erreur stable (ex. `DELIVERY_CANCELLED`). Le livreur doit voir un message clair, pas entrer dans le vide. |
| `completed` | **409** + code stable (ex. `DELIVERY_COMPLETED`). La commande est déjà livrée. |
| aucune | Chemin normal : créer la delivery (inchangé). |

⚠️ **Ne pas casser la récupération après crash.** Le cas `active` est la raison d'être de
cette idempotence — un livreur qui tue l'app en pleine course doit retrouver sa course.
Vérifie ce chemin explicitement avant de committer.

### 🪤 LE PIÈGE À NE PAS RATER — `maybeSingle()` ligne 46
`.eq("order_id", orderId).maybeSingle()` **lève une erreur** dès qu'une commande a plus
d'une delivery. Aujourd'hui ça n'arrive jamais (une seule delivery par commande), mais
ce sera le cas normal le jour où « relancer » créera une 2e delivery.
→ **Passer dès maintenant à un tri explicite** : `.order(<colonne de date>, {ascending:false}).limit(1)`.

⚠️ **`deliveries` n'a PAS de colonne `created_at` en prod** (vérifié : la migration
`006_deliveries_tracking.sql` la déclare dans le `CREATE TABLE IF NOT EXISTS`, mais son
`ALTER TABLE` de rattrapage ajoute `status`, `last_lat`, `last_lng`, `last_position_at`,
`completed_at` — **et oublie `created_at`**. La table préexistait, donc la colonne n'est
jamais arrivée). → Vérifie les colonnes réelles avant d'écrire le tri, et si aucune colonne
de date ne convient, dis-le à Lamine plutôt que d'inventer un tri qui plantera en prod.

### Côté mobile (`~/livra-mobile`) — 2e temps, après le web
`course.tsx` gère déjà `!res.ok` (F8, `23a8f51`) et affiche `course.startDeliveryFailed`.
→ Ajouter deux messages i18n **FR + AR** distincts pour `DELIVERY_CANCELLED` et
`DELIVERY_COMPLETED`, dans la langue du livreur. Jamais de `json.error` brut (règle F8).
Formulation à faire valider par Lamine — c'est du texte terrain vu par un livreur DZ.

---

## À VÉRIFIER AU PASSAGE (ne pas coder sans accord de Lamine)

- **`orders.picked_up_at` reste rempli après une annulation.** C'est la racine du
  court-circuit. Faut-il le remettre à `null` quand la course est annulée ? Ça rendrait la
  commande réassignable « naturellement » — mais ça efface la trace du premier départ, et
  depuis le tour 3 une annulation met la commande en `returned`, donc elle n'est pas censée
  repartir sans décision du vendeur. **Question produit → Lamine tranche.** Ne pas coder.
- **Y a-t-il d'autres endpoints livreur** qui font confiance à un `deliveryId` sans vérifier
  son statut ? `complete-delivery` en particulier. Grep le pattern, rapporte ce que tu trouves.

---

## CONSÉQUENCE IMMÉDIATE POUR LE GATE DE LAMINE
Une fois le fix en place, **rescanner une commande déjà close affichera une erreur** — c'est
le comportement voulu. Pour gater, il faut **une commande fraîche à chaque test**.
Le dis-lui explicitement dans ton rendu, sinon il croira à une régression.

## RÈGLE DE TRAVAIL
Branche dédiée sur `~/livra` (pas sur `main`). Un commit par maillon. Après validation :
preview → **gate** → merge → deploy prod. Le tour 4 mobile n'est pas concerné : il reste
sur `design/neumorph-driver`, non mergé, en attente de son gate.
