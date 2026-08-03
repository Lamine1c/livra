# BRIEF — LOT 1 / VOLET WEB · LES ÉCRITURES SILENCIEUSES
> Source : `livra-mobile/tasks/PLAN_PRODUCTION.md` (LOT 1) + `livra-mobile/tasks/AUDIT_31JUIL.md`
> (famille ①, A2 · A3 · A4). Volet MOBILE (A1·A5·A6) = `~/livra-mobile/tasks/BRIEF_LOT1_MOBILE.md`.
> **Ne pas mélanger les repos.**

## 🎯 LE PATRON UNIQUE
Toute opération asynchrone doit être **attendue**, son résultat **lu**, son échec **logué** avec un
préfixe stable `[LOT1][Ax]`. Best-effort ≠ silencieux : un envoi WhatsApp qui rate ne doit **pas**
faire échouer le webhook (Meta le rejouerait) — mais il doit **laisser une trace**.
Le patron correct existe déjà dans ce fichier même : `confirm-order.ts:112` et `:138`.

---

## A2 · L'OTP part sans qu'on vérifie qu'il est parti 🔴 *(le plus grave du lot)*
`src/lib/confirm-order.ts` — 5 appels `await sendWhatsAppNotification(...)` **sans lire `.success`** :

| Ligne | Message | Enjeu |
|---|---|---|
| **235** | **MSG 2 — le code OTP** (branche `YES_RE`) | 🔴🔴 l'acheteur a dit OUI et **n'aura jamais son code** |
| 243 | MSG 4 — raisons (branche `NO_RE`) | le NON reste sans suite |
| 257 | MSG 5 — reschedule (`not_available`) | " |
| 294 | MSG 6 — annulation (`changed_mind`) | " |
| 331 | MSG 7 — objection prix (`found_cheaper`) | " |

**À faire, aux 5 sites**, patron identique à l.112 :
```
const r = await sendWhatsAppNotification(phone, msg);
if (!r.success) console.error(`[LOT1][A2] from=${masked} <MSG n> failed:`, r.error);
```

**En plus, ligne 235 UNIQUEMENT — un retry** : si le 1er envoi échoue, **réessayer une fois** après
1,5 s, puis loguer le résultat final. C'est le seul message du tunnel dont l'absence tue la commande.
Ne pas retenter les 4 autres.
```
let r = await sendWhatsAppNotification(phone, msg);
if (!r.success) {
  console.error(`[LOT1][A2] from=${masked} MSG2 (code) échec 1/2:`, r.error);
  await new Promise((s) => setTimeout(s, 1500));
  r = await sendWhatsAppNotification(phone, msg);
}
if (!r.success) console.error(`[LOT1][A2] from=${masked} MSG2 (code) ÉCHEC DÉFINITIF order=${order.id}:`, r.error);
```
⚠️ **Ne pas** changer la valeur de retour (`{ action: "code_sent" }`) ni le flux : le webhook doit
continuer à répondre 200. On rend l'échec **visible**, on ne le transforme pas en erreur HTTP.

📌 **Conséquence business notée, HORS de ce lot** : un acheteur qui n'a jamais reçu son code entre
aujourd'hui dans le score comme **faux scammer**. La correction (ne pas compter un ghost dont l'OTP
n'est jamais parti) appartient au **Trust Layer / F12-bis**. Ce lot rend le cas détectable, c'est tout.

---

## A3 · Le message WhatsApp est « consommé » avant d'être traité 🔴
`src/app/api/whatsapp/inbound/route.ts:157-166` — `claimInboundWamid(m.wamid)` marque le message comme
traité (l.157), **puis** `handleInboundReply()` tourne (l.163). Si ça jette, le `catch` (l.164) ne fait
que loguer → **le retry de Meta est dédupliqué et le message est perdu définitivement**.
→ Un hoquet DB de 2 s pendant un « OUI » = commande morte, invisible.

**Décision tranchée** : on **garde le claim avant** (il protège du double traitement concurrent, ce qui
compte pour un OTP) et on **libère le wamid dans le `catch`** pour que le retry Meta puisse repasser.
```
} catch (err) {
  console.error("[LOT1][A3] erreur traitement message:", err);
  if (m.wamid) {
    const { error: relErr } = await releaseInboundWamid(m.wamid);
    if (relErr) console.error("[LOT1][A3] release wamid échoué (message perdu):", m.wamid, relErr.message);
  }
}
```
`releaseInboundWamid` est à écrire **juste après `claimInboundWamid`** (`route.ts:9-21`, fonction locale
au fichier) : un simple `DELETE FROM whatsapp_inbound_events WHERE wamid = ...`, erreur **lue et loguée**.
*(Note : `claimInboundWamid` renvoie `true` aussi quand la dédup est indisponible (l.15-16) — dans ce cas
le DELETE ne supprimera rien, c'est sans conséquence.)*
❌ **Ne pas** inverser l'ordre claim/traitement — ça ouvrirait une fenêtre de double envoi d'OTP.

---

## A4 · Trois promesses non attendues en serverless 🔴
Vercel peut tuer l'exécution dès la réponse renvoyée. Le patron correct — `after()` de `next/server` —
est **déjà importé et utilisé** dans `whatsapp/inbound/route.ts`.

| Fichier:ligne | Ce qui peut disparaître |
|---|---|
| `src/app/api/driver/position/route.ts:65` | `insert delivery_positions` — l'historique GPS |
| `src/app/api/meta/leads/webhook/route.ts:137` | `sendExpoPush` — **le vendeur ne reçoit jamais la notif d'un lead Facebook** |
| `src/app/api/scan/route.ts:66` | `update drivers.last_scan_at` |

**À faire aux 3 sites** : remplacer `void <promesse>` par
```
after(async () => {
  const { error } = await <promesse>;            // ou: const r = await sendExpoPush(...)
  if (error) console.error("[LOT1][A4] <route>:", error.message);
});
```
Pour `meta/leads/webhook:137` : `sendExpoPush` renvoie `{ success, error }` → `if (!r.success) console.error(...)`.
⚠️ Vérifier l'import `import { after } from "next/server";` dans chacun des 3 fichiers.
⚠️ `meta/leads/webhook:137` est dans une boucle — un `after()` par itération est correct, ne pas
sortir la boucle du handler.

---

## 📐 CONTRAINTES
- ⚠️ **Le repo web est actuellement sur `fix/pricing-coherence` avec 2 fichiers modifiés non commités**
  (`cgu/page.tsx`, `pricing/page.tsx`). **Finir ou stasher ce chantier d'abord.** La branche LOT 1
  part de `main` (`5835a60`), pas de celle-là.
- Branche dédiée **`fix/lot1-ecritures-silencieuses`** off `main`. **Tag backup avant** :
  `backup/pre-lot1-web`.
- **Un commit par point** : `A2`, `A3`, `A4`.
- `tsc` + `build` **verts** à chaque commit. **Push sans merger**, sans déployer.
- Aucune signature de fonction publique modifiée, aucun code de retour changé.

## 🚦 GATE (un seul, après les 3 commits, sur preview)
1. **Clé Meta invalidée volontairement** (env preview) → répondre « OUI » depuis WhatsApp :
   le log doit montrer `[LOT1][A2] MSG2 (code) échec 1/2` **puis** `ÉCHEC DÉFINITIF`. Aujourd'hui : rien.
2. Faire jeter `handleInboundReply` (ex. table renommée en preview) → vérifier que le **wamid est
   libéré** et que le **retry Meta retraite bien le message**.
3. Poster une position livreur → la ligne `delivery_positions` doit exister **après** la réponse 200.
4. Envoyer un lead Meta de test → **le push « nouveau lead » arrive** chez le vendeur.
