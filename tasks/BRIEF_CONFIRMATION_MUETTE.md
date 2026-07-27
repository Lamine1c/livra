# BRIEF cc — 🔴 LE VENDEUR N'EST JAMAIS PRÉVENU D'UNE CONFIRMATION (27 juil, gate)

> Repo : `~/livra` (web). **Bug de prod, antérieur au tour 4.**
> Trouvé au gate : l'acheteur confirme par OTP WhatsApp → la commande passe bien
> `confirmed` en base → **le vendeur ne reçoit rien et ne voit rien**.

---

## LA PREUVE

`src/lib/confirm-order.ts` · `confirmOrderByInboundCode()` fait exactement 3 choses :
1. `orders.update({ status: "confirmed", otp_verified_at, otp_code: null })`
2. envoie l'accusé WhatsApp à **l'acheteur** (`order_confirmed_verified`)
3. `return { matched: true, orderId }`

**Aucun push vendeur.** Le seul `sendExpoPush` du fichier est ligne 274, dans la branche
**« Changé d'avis »** de `handleInboundReply` — c'est-à-dire **une annulation**.

→ **Le vendeur est notifié quand un client ANNULE, jamais quand il CONFIRME.**

Confirmé en réel au gate : la commande était bien `confirmed` (le vendeur a eu le popup
« commande déjà confirmée » en tentant de renvoyer une demande), sans aucune notification
ni changement visible à l'écran.

---

## POURQUOI C'EST LE PLUS GRAVE DES TROIS TROUS DU JOUR

La confirmation est **le seul moment du tunnel où le vendeur doit agir** : préparer le colis,
appeler le livreur, lancer la course. C'est l'instant où une notification a une vraie valeur
opérationnelle.

C'est aussi le seul qui n'en a pas. L'asymétrie est totale : on réveille le vendeur pour une
mauvaise nouvelle (annulation), on le laisse dans le noir pour la bonne.

**Effet terrain** : le vendeur ne sait pas qu'il peut expédier. La commande dort. L'acheteur
a confirmé et attend. Personne n'est en faute, personne ne le voit.

---

## LE FIX

Dans `confirmOrderByInboundCode`, **après** l'update réussi et **avant** (ou après, peu importe)
l'accusé acheteur : charger le profil vendeur et envoyer un push.

**Le patron existe déjà à 20 lignes de là** — branche « Changé d'avis », lignes 255-285 :
```ts
const { data: vendor } = await supabase
  .from("profiles")
  .select("store_name, full_name, expo_push_token, locale")
  .eq("id", order.user_id)
  .single();
...
if (vendor?.expo_push_token) {
  const { title, body } = orderCancelled(vendor.locale, { reference: ... });
  await sendExpoPush(vendor.expo_push_token, title, body, { orderId, type: "order_cancelled" });
}
```
→ **Copie ce patron, ne réinvente rien.**

### Points d'attention
- **`user_id` doit être dans le SELECT** de `confirmOrderByInboundCode`. Vérifie la requête
  (`:82`) — elle sélectionne `id, otp_code, otp_sent_at, client:clients(phone)`. `user_id`
  n'y est **pas**. `findPendingForPhone` (`:147`), elle, le sélectionne. À aligner.
- **Message** : il faut un `orderConfirmed(locale, {...})` dans `src/lib/push-messages.ts`.
  Vérifie s'il existe déjà ; sinon crée-le sur le modèle de `orderCancelled`. **FR + AR.**
  Le sens : le client a confirmé, la commande peut partir. Propose le texte à Lamine.
- **`type` dans le payload** : utilise un type distinct (ex. `order_confirmed`) — le mobile
  route sur ce champ.
- **Best-effort strict** : un échec de push ne doit **jamais** faire échouer la confirmation
  déjà persistée, ni faire échouer le webhook (Meta le rejouerait en boucle). Log + continue,
  exactement comme l'accusé acheteur ligne 130.
- **Canal Android** : `sendExpoPush` pose déjà `sound:"default"` + `priority:"high"` +
  `channelId:"commandes-v1"`. Rien à faire, mais ne le contourne pas.

---

## 🟡 VOLET MOBILE — « ÇA DOIT ÊTRE INSTANTANÉ » (demande Lamine, gate 27 juil)

Constat au gate : la commande n'apparaît « Confirmée » qu'après être **sorti et revenu** sur
la liste (`useFocusEffect`, `app/(vendor)/orders/index.tsx:48`). Un vendeur qui reste sur son
écran ne voit rien bouger.

**Décision : PAS de Realtime sur la liste.** Il coûte un abonnement permanent, du
REPLICA IDENTITY, de la batterie sur ZTE — pour un gain marginal.

**À la place** : un listener de **notification reçue** (`addNotificationReceivedListener`,
app au premier plan) qui déclenche le refetch de la liste si le payload porte
`type: "order_confirmed"`. Quelques lignes, zéro dépendance, zéro changement d'archi.
→ Le vendeur voit la commande basculer en direct, notification à l'appui.

⚠️ **À faire APRÈS le fix web** — sans le push, ce listener n'a rien à écouter.
⚠️ Repo `~/livra-mobile`, donc **branche séparée du fix web**. Ne pas mélanger.

---

## CE QU'ON NE FAIT PAS
❌ **Ne pas ajouter de Realtime sur la liste des commandes.** Elle a déjà un `useFocusEffect`
(`app/(vendor)/orders/index.tsx:48`) qui refetch au retour d'écran. Le Realtime reste
volontairement limité au détail commande (décision assumée, `HANDOFF.md`). Le push est ce qui
manquait : il réveille le vendeur, il tape la notif, il arrive sur le détail — qui lui est
déjà en Realtime. **Un seul maillon à ajouter, pas trois.**

---

## VÉRIFICATION APRÈS FIX
1. Commande fraîche → demande de confirmation → l'acheteur répond **OUI** puis le **bon code**.
2. Le vendeur (appareil **physique**, app en **arrière-plan**) doit recevoir un push
   **sonore et en heads-up**, avec la référence de la commande.
3. Taper la notification → doit ouvrir la commande concernée.
4. La liste doit afficher « Confirmée » au retour sur l'écran.
5. **Non-régression** : l'accusé WhatsApp acheteur part toujours, et un échec de push ne
   casse ni la confirmation ni la réponse au webhook.

## RÈGLE DE TRAVAIL
Branche dédiée, pas sur `main`. Séparée de `fix/course-fantome-start-delivery` et du fix OTP
silencieux : **trois bugs distincts, trois branches, trois gates.**
