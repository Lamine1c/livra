# RAPPORT — /api/scan face aux crawlers d'aperçu (AUDIT_31JUIL C6)

> **Mission LECTURE SEULE.** Aucun code modifié, aucune branche, aucun commit.
> Fichiers lus : `src/app/api/scan/route.ts`, `src/lib/qr-token.ts`, `src/middleware.ts`,
> `next.config.ts`, `~/livra-mobile/app/(vendor)/orders/[id].tsx`,
> `~/livra-mobile/app/(driver)/scan.tsx`. Aucune requête réseau exécutée.
> Chaque affirmation est sourcée `fichier:ligne`. Ce qui n'est pas prouvable par lecture
> est marqué **« non vérifiable par lecture de code, il faut un test réseau »**.

---

## RÉSUMÉ EN 5 LIGNES

1. Un GET sur `/api/scan?t=<token_valide>` **sans `d`** fait bien passer la commande
   `pending`/`confirmed` → `processing`. **Prouvé.** L'update (l.79-83) est HORS du bloc `if (deviceId)`.
2. **Rien dans le code n'empêche un crawler** : pas de check User-Agent, pas de distinction
   de méthode, pas d'auth au-delà du token, et le `middleware.ts` **exclut `/api`**.
3. **MAIS** — le QR émis aujourd'hui pointe sur `${API_BASE}/scan?t=…` (**`/scan`, pas `/api/scan`**),
   or `/scan` **n'est pas une route** (ni page, ni rewrite) → un GET direct dessus fait **404**,
   n'atteint jamais le handler, ne déclenche rien. **Le risque n'est donc PAS live via le QR actuel.**
4. Le danger réel est **LOT 7** : si le lien WhatsApp « relancer » pointe (directement ou par
   erreur) sur `/api/scan?t=…`, un crawler Meta le déclenche. C'est une **décision de design LOT 7**,
   pas encore codée.
5. Un GET valide expose une **PII lourde** : nom + téléphone + adresse + **GPS domicile** + contenu
   et montants de la commande. **Prouvé** depuis le SELECT réel.

---

## Q1 — Un GET sans `d` fait-il passer la commande en `processing` ? (trace ligne par ligne)

**OUI. Prouvé.**

`src/app/api/scan/route.ts` :
- **l.5** `export async function GET(req)` — c'est un handler **GET**.
- **l.6-10** : lit `t` (query). Absent → 400, stop.
- **l.12-20** : `verifyQrToken(t)`. Invalide/expiré → 400/410, stop. (Détail Q2.)
- **l.24-43** : SELECT de la commande `WHERE id = orderId AND qr_token = t`. Si le token ne
  correspond plus au `qr_token` en base (ex. régénéré) → l.45-47 → 400, stop.
- **l.49-53** : SELECT vendeur (pour `vendorName`).
- **l.57-58** : `const deviceId = req.nextUrl.searchParams.get("d")`. **Optionnel.**
- **l.59-75** : `if (deviceId) { … }` — CE bloc (lookup driver, `after()` sur `last_scan_at`,
  génération `deviceToken`) est **le SEUL** gardé par `d`. Sans `d`, on saute tout ce bloc,
  `deviceToken` reste `null`.
- **l.79-83** — **HORS du `if`, au niveau racine de la fonction** :
  ```ts
  await supabase.from("orders")
    .update({ status: "processing" })
    .eq("id", result.orderId)
    .in("status", ["pending", "confirmed"]);
  ```
  → Cet `await` s'exécute **à chaque GET avec un token valide**, que `d` soit présent ou non.
- **l.90-103** : renvoie le payload (PII, cf. Q4).

**Conditions exactes pour que la transition écrive** :
- token signé valide + non expiré (`EXPIRY_MS = 24h`, `qr-token.ts:3`) ;
- `t` == `orders.qr_token` courant (l.42) ;
- statut courant ∈ `{pending, confirmed}` (l.83) — sinon 0 ligne mise à jour (no-op, mais **la PII sort quand même**, cf. Q4).

Le paramètre `d` **n'a aucune influence** sur cette transition. Il ne pilote que la génération du
`deviceToken` GPS. **Confirmé.**

---

## Q2 — Le crawler d'aperçu WhatsApp (Meta) déclencherait-il la transition ?

### Ce qui est PROUVÉ par le code

**Au niveau du handler `/api/scan`, rien n'empêche un crawler :**
- **Aucun check User-Agent** dans `scan/route.ts` (0 occurrence de `user-agent`/`headers.get`).
- **Aucune distinction de méthode** : seul `GET` est exporté ; le crawler fait un GET → même chemin
  que l'app. Pas de POST requis, pas de vérification de méthode.
- **Aucune auth** au-delà du token : `verifyQrToken` (`qr-token.ts`) est un **pur HMAC-SHA256 +
  parse + expiry**. Il ne regarde ni IP, ni User-Agent, ni session, ni `d`. Un crawler qui possède
  l'URL avec un `t` valide le passe intégralement.
- **Le middleware NE protège PAS `/api`** : `src/middleware.ts` = `createMiddleware(routing)`
  (next-intl, i18n uniquement), matcher
  `"/((?!api|track|locate|oauth|billing|ingest|_next|_vercel|.*\\..*).*)"`.
  `/api` est **exclu** → aucun middleware ne s'exécute sur `/api/scan`. (Le commentaire du fichier
  parle de « protéger » ces routes, mais c'est une exclusion i18n, **pas un garde-fou anti-bot**.)

→ **Un GET de crawler sur `/api/scan?t=<valide>` déclencherait la transition + la fuite PII.
Rien dans le code ne l'en empêche.**

### Ce qui CHANGE tout aujourd'hui (et qui est aussi prouvé)

Le lien qui **circule réellement** n'est pas `/api/scan`. Le QR émis vaut
`${API_BASE}/scan?t=${qr_token}` (`~/livra-mobile/app/(vendor)/orders/[id].tsx:1197`,
`API_BASE = https://golivra.app`) → **`/scan`, sans `/api`**.

Or **`/scan` n'existe pas** côté web :
- `find src/app -path "*scan*"` ne renvoie **que** `src/app/api/scan/route.ts` (aucune page `/scan`,
  aucun `[locale]/scan`).
- `next.config.ts` : les seuls rewrites visent `/ingest/*` → PostHog ; les seuls redirects sont
  `/blog`, `/tarifs`. **Aucun `/scan → /api/scan`.** Pas de `vercel.json` avec rewrites.
- `/scan` n'est pas dans l'exclusion du middleware → il passe par le middleware i18n → aucune page
  correspondante → **404** (ou redirection locale puis 404).

→ **Aujourd'hui, un GET direct sur l'URL du QR (`https://golivra.app/scan?t=…`) fait 404 et
n'atteint jamais le handler `/api/scan`.** La transition ne vit QUE dans `/api/scan`, appelé
**par l'app mobile** après extraction du token (`(driver)/scan.tsx`, `extractToken` + fetch
`/api/scan?t=&d=`). Un crawler qui pré-visualise le lien du QR ne déclenche donc rien.

### Le vrai risque : LOT 7 (non codé)

La question devient : **quel URL le lien WhatsApp « relancer » (LOT 7) va-t-il contenir ?**
- S'il reprend le format du QR (`/scan?t=`) → **404**, sûr (tant que `/scan` reste sans route/rewrite).
- S'il pointe sur **`/api/scan?t=`** (pour « marcher sans l'app », ou par copier-coller) → un crawler
  Meta le **déclenche** (transition + PII). Rien ne l'arrête.
- Si LOT 7 (ou plus tard) ajoute une **page `/scan`** qui appelle `/api/scan` côté serveur → même
  problème.

**LOT 7 n'est pas encore codé** → l'URL exact qu'il fera circuler est **non vérifiable par lecture de
code**. Le point dur à retenir : **le endpoint est dangereux par conception (GET à effet de bord +
PII, zéro garde anti-bot) ; sa non-exposition actuelle tient uniquement au fait que le QR pointe sur
un `/scan` qui 404.** C'est fragile : une seule ligne (`/scan?t=` → `/api/scan?t=`) dans LOT 7 ouvre la faille.

### Ce qui n'est PAS vérifiable par lecture de code
- **Est-ce que le crawler Meta (`facebookexternalhit`) émet effectivement un GET** sur l'URL partagée,
  et le suit-il jusqu'au bout (redirects, timeouts) ? → **non vérifiable par lecture de code, il faut
  un test réseau** (partager un lien réel et observer les logs Vercel + le statut en base).
- Le comportement de Meta face à un **404** (`/scan`) : ne déclenche rien côté `/api/scan` (prouvé par
  l'absence de route), mais le détail des tentatives du crawler → test réseau.

---

## Q3 — Autres crawlers (aperçu iMessage, antivirus, préchargement navigateur)

**Réponse code identique à Q2** : le handler `/api/scan` ne fait **aucune** distinction — ni
User-Agent, ni méthode, ni provenance. **N'importe quel** agent qui émet un GET sur `/api/scan?t=<valide>`
déclenche la transition + la PII. Il n'existe donc, dans le code, **rien** qui traite iMessage,
un antivirus (ex. scan de lien Safe Links), ou un préchargement navigateur (`prefetch`, `preconnect`,
Chrome/Safari qui pré-charge un lien survolé) différemment de l'app.

Deux garde-fous involontaires, les mêmes qu'en Q2 :
1. l'URL qui circule aujourd'hui est `/scan` (404) → ces agents n'atteignent pas le handler ;
2. le token doit être valide + correspondre au `qr_token` courant + statut `pending`/`confirmed`.

**Non vérifiable par lecture de code** : lesquels de ces agents (iMessage, antivirus d'entreprise,
prefetch navigateur) émettent réellement un GET, avec quel User-Agent, et respectent-ils un éventuel
`robots.txt` — **il faut un test réseau**. Le code, lui, ne se défend contre aucun d'eux.
(Remarque : le préchargement navigateur est le plus insidieux — un vendeur qui **survole** son propre
lien `/api/scan?t=` dans un webmail/WhatsApp Web pourrait le déclencher. Mais uniquement si l'URL
résout vers `/api/scan` — donc, encore, dépend de LOT 7.)

---

## Q4 — PII exacte sortie d'un GET non authentifié (depuis le SELECT réel, l.24-53 + payload 84-103)

Le payload (l.90-103) fait `...order` (spread de tout l'objet SELECT) **plus** des champs aplatis.
Tout ce qui suit sort d'un **GET avec un token valide, SANS `d`, sans aucune auth** :

**Acheteur (identité + localisation — le plus grave) :**
- `client.full_name` → **nom complet** (aussi aplati en `buyer_name`, l.95)
- `client.phone` → **téléphone** (aussi aplati en `buyer_phone`, l.96)
- `client.address` → **adresse postale** (aussi aplati en `buyer_address`, l.97)
- `client.wilaya` → wilaya (aussi `buyer_wilaya`, l.98)
- `client.commune` → **commune** (présente dans `order.client` via le spread `...order` ; **non**
  aplatie mais **exposée** dans l'objet `client`)
- `buyer_lat`, `buyer_lng` (l.36-37) → **coordonnées GPS du point de livraison / domicile**

**Commande :**
- `reference` (n° de commande), `status`, `delivery_mode`
- `total_amount`, `delivery_fee` → **montants** (dont le COD)
- `notes` (l.34) → **texte libre** (peut contenir n'importe quoi saisi par le vendeur)
- `created_at`
- `qr_token` (l.31) → le **token lui-même est renvoyé** dans la réponse (l.94 `...order`)

**Articles (`items:order_items`, l.39), pour chaque ligne :**
- `product_name` → **ce qui a été acheté**
- `quantity`, `unit_price`, `total_price` → quantités et prix

**Vendeur :**
- `vendorName` = `store_name ?? full_name` (l.100) → identité de la boutique.
- ⚠️ **`vendor.phone` est LU (l.51) mais N'EST PAS renvoyé** (seul `vendorName` l'est). Pas de fuite
  du téléphone vendeur. (Prouvé : `phone` n'apparaît pas dans le JSON l.90-103.)

**Bilan** : un seul GET non authentifié = **nom + téléphone + adresse + GPS de l'acheteur + contenu et
montants de la commande + notes libres**. C'est une fuite PII sévère, et elle sort **même quand la
transition de statut est un no-op** (commande déjà `processing`+), car le SELECT/renvoi précède et est
indépendant de l'update.

---

## 2 CORRECTIONS POSSIBLES (proposées, NON codées)

> Rappel : le cœur du problème est un **GET à effet de bord (write) + PII, sans garde**. Toute correction
> doit séparer *lire* de *muter*, et/ou exiger une preuve d'app. Les deux options ci-dessous.

### Option A — GARDE le lien cliquable (un humain tape, ça marche)

**Idée** : le lien WhatsApp pointe vers une **page HTML `/scan`** (à créer) — légère, **sans PII** —
qui affiche un aperçu neutre (« Commande LIVRA — ouvrir dans l'app ») + un **deep link** vers l'app.
La **lecture PII** et la **transition de statut** + `last_scan_at` + `deviceToken` passent dans un
**POST authentifié** (`/api/scan` en POST, ou nouvel endpoint) appelé **uniquement par l'app** avec `d`.
Le GET public (page + éventuel GET read-only) ne renvoie **rien de sensible** et ne mute **rien**.

- **Effet crawler** : Meta/iMessage/etc. pré-visualisent la page HTML → aperçu propre, **0 PII, 0 effet
  de bord**. Le token dans l'URL ne déclenche plus rien par simple GET.
- **Coût** : **moyen**. À faire : (1) créer la page `/scan` (aperçu + deep link) ; (2) transformer la
  mutation en POST (déplacer l.79-83 + le bloc `d` l.59-75) ; (3) retirer/verrouiller la PII du chemin
  GET public ; (4) adapter `(driver)/scan.tsx` mobile pour appeler le POST au lieu du GET actuel.
  **Touche web + mobile**, plus un flux à re-gater.

### Option B — NE GARDE PAS le lien cliquable (seule l'app fonctionne)

**Idée** : exiger un **device livreur authentifié pour TOUT effet**. Concrètement : déplacer l'update
de statut (l.79-83) **À L'INTÉRIEUR** du bloc `if (driver?.id)` (l.65), et ne renvoyer la **PII que si
`driver?.id`** est résolu. Rendre `d` **obligatoire** : sans `d` valide → 401 + réponse minimale
(ni transition, ni PII). Idéalement, basculer la mutation en **POST** (pour couper aussi les
prefetch/GET). Le token seul, dans un lien ouvert par un humain **ou** un crawler dans un navigateur,
devient **inerte**.

- **Effet crawler** : aucun crawler n'a de `deviceId` d'un driver enregistré → **0 transition, 0 PII**.
  Le lien n'est **pas** exploitable hors de l'app.
- **Coût** : **faible** — ~5-10 lignes dans `src/app/api/scan/route.ts` (envelopper l'update + le
  payload PII dans `if (driver?.id)`, exiger `d`). Pas de nouvelle page. **Contrepartie** : LOT 7 doit
  router **via l'app** (deep link / QR scanné), pas un simple lien web cliquable — un lien ouvert dans
  un navigateur ne fait plus rien.

---

## CE QUI RESTE À PROUVER PAR TEST RÉSEAU (non déductible du code)
1. Est-ce que `facebookexternalhit` (Meta) — et les crawlers iMessage/antivirus/prefetch — émettent
   réellement un GET sur l'URL partagée, et jusqu'où ils le suivent.
2. Le format d'URL exact que **LOT 7** fera circuler (endpoint non écrit).
3. Le comportement observé sur un `/scan` en 404 (confirmé inerte côté `/api/scan` par lecture, mais
   le détail des tentatives du crawler = observation réseau).
