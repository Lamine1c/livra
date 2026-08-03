# INVENTAIRE TEMPLATES WhatsApp — ÉTAT FACTUEL (lecture seule)

> Produit le 31 juil 2026 · mission AUDIT_31JUIL C1 · repo `~/livra`.
> **Aucune réécriture, aucune proposition de copy.** Textes recopiés verbatim depuis
> `src/lib/whatsapp-templates.ts` (lu en entier). Chaque affirmation est sourcée fichier:ligne.

---

## 0. CHIFFRES BRUTS

- **13 templates** définis dans `src/lib/whatsapp-templates.ts` (objet `TEMPLATES`, l.22-308).
  Tous en `category: "UTILITY"`, `language: "fr"`.
- **2 fonctions d'envoi** dans `src/lib/whatsapp.ts` :
  - `sendWhatsAppTemplate(phone, template, variables)` (l.88-97) → payload `type: "template"` Meta
    (`buildTemplatePayload`, whatsapp-templates.ts:313-346). **Marche hors fenêtre 24 h** (business-initiated).
  - `sendWhatsAppNotification(phone, message)` (l.147-154) → `sendMetaText` → payload `type: "text"`
    (`buildTextPayload`, l.156-163). **Texte libre. Délivré UNIQUEMENT dans la fenêtre 24 h.**
- Le rendu texte libre passe par `renderTemplateText(template, variables)` (whatsapp-templates.ts:352-361) :
  il interpole `{{n}}` dans `template.body` et **jette les boutons** (commentaire l.350-351 : les
  quick-reply « ne s'appliquent qu'au format template Meta … pas au texte libre »).

**Répartition (confirmée par les sites d'appel, section 2) :**
- **6 envoyés en TEMPLATE** (`sendWhatsAppTemplate`) : `order_confirmation_request`, `delivery_mode_perso`,
  `delivery_mode_carrier`, `delivery_perso_enroute`, `delivery_completed`, `delivery_failed`.
- **7 envoyés en TEXTE LIBRE** (`renderTemplateText` → `sendWhatsAppNotification`), tous dans
  `confirm-order.ts` : `order_otp_code`, `order_confirmed_verified`, `order_otp_wrong_code`,
  `order_cancel_reasons`, `order_reschedule_request`, `order_cancelled_mind_changed`, `order_objection_cheaper`.
  → **Ce sont les 7 « du tunnel » de la mission. Aucun ne part en template.**

---

## 1. TABLEAU RÉCAP

| MSG | Template | Envoi | fichier:ligne d'appel | Boutons définis | Boutons envoyés ? |
|---|---|---|---|---|---|
| MSG 1 | `order_confirmation_request` | **TEMPLATE** | `send-otp/route.ts:109` | OUI/NON (2) | oui (format template) |
| MSG 2 | `order_otp_code` | texte libre | `confirm-order.ts:234-235` | aucun | — |
| (accusé) | `order_confirmed_verified` | texte libre | `confirm-order.ts:137-138` | aucun | — |
| (wrong) | `order_otp_wrong_code` | texte libre | `confirm-order.ts:111-112` | aucun | — |
| MSG 4 | `order_cancel_reasons` | texte libre | `confirm-order.ts:242-243` | 3 (Pas dispo / Changé d'avis / Moins cher) | **NON — perdus** |
| MSG 5 | `order_reschedule_request` | texte libre | `confirm-order.ts:256-257` | aucun | — |
| MSG 6 | `order_cancelled_mind_changed` | texte libre | `confirm-order.ts:293-294` | aucun | — |
| MSG 7 | `order_objection_cheaper` | texte libre | `confirm-order.ts:330-331` | OUI/NON (2) | **NON — perdus** |
| MSG 8 | `delivery_mode_perso` | **TEMPLATE** | `locate-link/route.ts:55` | aucun | — |
| MSG 9 | `delivery_mode_carrier` | **TEMPLATE** | `ecotrack/route.ts:105` · `yalidine/route.ts:98` | aucun | — |
| MSG 12 | `delivery_perso_enroute` | **TEMPLATE** | `start-delivery/route.ts:130` · `driver-notify/route.ts:52` | aucun | — |
| MSG 10 | `delivery_completed` | **TEMPLATE** | `complete-delivery/route.ts:139` · `yalidine-poll/route.ts:176` | aucun | — |
| MSG 11 | `delivery_failed` | **TEMPLATE** | `yalidine-poll/route.ts:179` | aucun | — |

⚠️ **`order_cancel_reasons` (MSG 4) et `order_objection_cheaper` (MSG 7) définissent des boutons quick-reply
mais partent en texte libre** → les boutons ne sont jamais rendus (`renderTemplateText` ne les porte pas).

---

## 2. VERBATIM DES 13 TEMPLATES (recopiés, non résumés)

Pour chaque : `name`, `category`, `language`, `variables` (ordre = `{{1}}…{{n}}`), boutons, mode d'envoi,
et le `body` exact (bloc AR d'abord, séparateur `━━━━━━━━━━━━━━`, bloc FR — l'ordre du code).

---

### MSG 1 — `order_confirmation_request` (l.24-54)
- category `UTILITY` · language `fr`
- variables : `["prénom", "boutique", "produit", "total"]` → `{{1}}=prénom {{2}}=boutique {{3}}=produit {{4}}=total`
- boutons : `✅ إيه / OUI` · `❌ لا / NON`
- **envoi : TEMPLATE** — `sendWhatsAppTemplate` à `send-otp/route.ts:109`

```
message en français suit

سلام {{1}} 👋
كوموند تاعك عند {{2}} محجوزة باسمك.

🛍️ {{3}}
💰 ‪{{4}}‬ دج
📦 الخلاص عند التوصيل · ما تخلص والو دروك

تحب نبداو التوصيل ؟

━━━━━━━━━━━━━━

Bonjour {{1}} 👋
Bonne nouvelle : votre commande chez {{2}} est réservée à votre nom.

🛍️ {{3}}
💰 {{4}} DA
📦 Paiement à la livraison · rien à payer maintenant

Voulez-vous procéder à la livraison ?
```

---

### MSG 2 — `order_otp_code` (l.57-79)
- category `UTILITY` · language `fr`
- variables : `["code"]` → `{{1}}=code`
- boutons : aucun
- **envoi : TEXTE LIBRE** — `renderTemplateText` puis `sendWhatsAppNotification` à `confirm-order.ts:234-235`

```
message en français suit

باش نأكدو ونطلقو التوصيل، رد على هاد الرسالة بالكود تاعك :

✅ {{1}}

بلا تأكيد، ما نقدروش نوصلولك.
راني نستنى الكود تاعك 🙂

━━━━━━━━━━━━━━

Pour confirmer et lancer la livraison, répondez avec votre code :

✅ {{1}}

Sans confirmation, on ne pourra pas vous l'envoyer.
On attend votre code 🙂
```

---

### (accusé) — `order_confirmed_verified` (l.82-96)
- category `UTILITY` · language `fr`
- variables : `[]`
- boutons : aucun
- **envoi : TEXTE LIBRE** — `confirm-order.ts:137-138`

```
message en français suit

✅ مبروك! الطلبية ثابتة.
راك ولّيت زبون مؤكَّد LIVRA ✓ — الزبائن الموثوقين يُخدمو بالأولوية.

━━━━━━━━━━━━━━

✅ C'est validé ! Commande confirmée.
Vous êtes maintenant client vérifié LIVRA ✓ — les clients fiables sont servis en priorité.
```

---

### (wrong code) — `order_otp_wrong_code` (l.103-119)
- category `UTILITY` · language `fr`
- variables : `[]`
- boutons : aucun
- **envoi : TEXTE LIBRE** — `confirm-order.ts:111-112`
- commentaire du code (l.99-102) : envoyé UNIQUEMENT sur `wrong_code`, texte libre assumé (fenêtre 24 h ouverte
  car l'acheteur vient d'écrire), pas de « N essais restants » (aucune limite d'essais en V1).

```
message en français suit

⚠️ هاد الكود ماشي صحيح.
عاود بعثلنا الكود الصحيح باش نأكدو ونطلقو التوصيل.
راني نستنى الكود تاعك 🙂

━━━━━━━━━━━━━━

⚠️ Ce code ne correspond pas.
Renvoyez-nous le bon code pour confirmer et lancer la livraison.
On attend votre code 🙂
```

---

### MSG 4 — `order_cancel_reasons` (l.124-141)
- category `UTILITY` · language `fr`
- variables : `[]`
- boutons : `📅 ماشي اليوم / Pas dispo` · `🤔 بدلت رايي / Changé d'avis` · `💰 لقيت أرخص / Moins cher`
  (commentaire l.122-123 : labels > 20 caractères = au-dessus de la limite Meta quick-reply, à raccourcir avant soumission)
- **envoi : TEXTE LIBRE** — `confirm-order.ts:242-243` → **les 3 boutons ne sont PAS rendus**

```
message en français suit

ما كانش مشكل 🙂 قلنا علاش :

━━━━━━━━━━━━━━

Pas de souci 🙂 Dites-nous pourquoi :
```

---

### MSG 5 — `order_reschedule_request` (l.144-158)
- category `UTILITY` · language `fr`
- variables : `[]`
- boutons : aucun
- **envoi : TEXTE LIBRE** — `confirm-order.ts:256-257`

```
message en français suit

ما كانش مشكل ! خاير نهار يناسبك ؟
رد بالنهار اللي يناسبك 📅

━━━━━━━━━━━━━━

Pas de souci ! Quel jour vous arrange ?
Répondez avec le jour qui vous convient 📅
```

---

### MSG 6 — `order_cancelled_mind_changed` (l.161-175)
- category `UTILITY` · language `fr`
- variables : `["prénom", "boutique"]` → `{{1}}=prénom {{2}}=boutique`
- boutons : aucun
- **envoi : TEXTE LIBRE** — `confirm-order.ts:293-294`

```
message en français suit

فهمت {{1}}، نلغيو.
إلا بدلت رايك، {{2}} راهي في خدمتك دايما 👋

━━━━━━━━━━━━━━

Compris {{1}}, on annule.
Si vous changez d'avis, {{2}} reste à votre service 👋
```

---

### MSG 7 — `order_objection_cheaper` (l.178-206)
- category `UTILITY` · language `fr`
- variables : `[]`
- boutons : `✅ إيه / OUI` · `❌ لا / NON`
- **envoi : TEXTE LIBRE** — `confirm-order.ts:330-331` → **les 2 boutons ne sont PAS rendus**

```
message en français suit

المثل يقول : "على رخصو خلا نصو" 😜

في اغلب الوقت، الرخيص يخبي منتوج مزيف ولا بياع ماشي محترف.
هنا تخلص كي يوصلك المنتوج — تشوفو، تقلبو، تتحقق منو، وبعد تخلص.
راك ما تخسر والو.

نكملو ؟

━━━━━━━━━━━━━━

Le proverbe le dit : "على رخصو خلا نصو" 😜

Le moins cher cache souvent un faux produit ou un vendeur pas professionnel.
Ici, vous payez à la livraison — une fois le produit en main, vérifié.
Vous risquez zéro.

On continue ?
```

---

### MSG 8 — `delivery_mode_perso` (l.210-234)
- category `UTILITY` · language `fr`
- variables : `["prénom", "boutique", "lien"]` → `{{1}}=prénom {{2}}=boutique {{3}}=lien`
  (commentaire l.209 : `{{3}}` = lien locate)
- boutons : aucun
- **envoi : TEMPLATE** — `locate-link/route.ts:55`

```
message en français suit

🛵 {{1}}، كوموندك عند {{2}} واجدة باش تطلق !
اختار وين تحب نوصلوك : الدار، الخدمة، القهوة…

📍 {{3}}

الليفرور تاع {{2}} يلقاك — بلا ما يعيط، بلا حيرة، بلا ما تكتب أدريسة.
وتشوفو في direct حتى يوصل لبابك 🐺

━━━━━━━━━━━━━━

🛵 {{1}}, votre commande chez {{2}} est prête à partir !
Choisissez où vous faire livrer : domicile, travail, café…

📍 {{3}}

Le livreur de {{2}} vous trouvera — sans appel, sans galère, sans adresse à taper.
Et vous le suivrez en live jusqu'à votre porte 🐺
```

---

### MSG 9 — `delivery_mode_carrier` (l.237-253)
- category `UTILITY` · language `fr`
- variables : `["prénom", "boutique", "transporteur", "lien_tracking"]` → `{{1}} {{2}} {{3}} {{4}}`
- boutons : aucun
- **envoi : TEMPLATE** — `ecotrack/route.ts:105` (`carrierLabel`) · `yalidine/route.ts:98` (`"Yalidine"` en dur)

```
message en français suit

📦 {{1}}، كوموندك عند {{2}} تبعثت مع {{3}}.
تابعها حتى توصلك :
🔗 {{4}}

━━━━━━━━━━━━━━

📦 {{1}}, votre commande chez {{2}} a été expédiée via {{3}}.
Suivez-la jusqu'à vous :
🔗 {{4}}
```

---

### MSG 12 — `delivery_perso_enroute` (l.257-273)
- category `UTILITY` · language `fr`
- variables : `["prénom", "boutique", "lien_tracking"]` → `{{1}} {{2}} {{3}}`
- boutons : aucun
- **envoi : TEMPLATE** — `start-delivery/route.ts:130` · `driver-notify/route.ts:52`

```
message en français suit

🛵 {{1}}، الليفرور تاع {{2}} راه في الطريق !
تابعو live حتى يوصل لبابك :
🔗 {{3}}

━━━━━━━━━━━━━━

🛵 {{1}}, le livreur de {{2}} est en route vers vous !
Suivez-le en live jusqu'à votre porte :
🔗 {{3}}
```

---

### MSG 10 — `delivery_completed` (l.276-290)
- category `UTILITY` · language `fr`
- variables : `["boutique"]` → `{{1}}=boutique`
- boutons : aucun
- **envoi : TEMPLATE** — `complete-delivery/route.ts:139` (`vendorName`) · `yalidine-poll/route.ts:176` (`shopName`)

```
message en français suit

✅ كوموندك عند {{1}} وصلت بشكل مزيان.
شكرا على ثقتك في LIVRA 🐺

━━━━━━━━━━━━━━

✅ Votre commande chez {{1}} a bien été livrée.
Merci d'avoir choisi LIVRA 🐺
```

---

### MSG 11 — `delivery_failed` (l.293-307)
- category `UTILITY` · language `fr`
- variables : `["boutique"]` → `{{1}}=boutique`
- boutons : aucun
- **envoi : TEMPLATE** — `yalidine-poll/route.ts:179` (`shopName`)

```
message en français suit

⚠️ الليفرور ما قدرش يلقاك.
تواصل مع {{1}} باش تعاودو الموعد.

━━━━━━━━━━━━━━

⚠️ Le livreur n'a pas pu vous joindre.
Contactez {{1}} pour reprogrammer votre livraison.
```

---

## 3. MSG 1 — RENDU EXACT AUJOURD'HUI + QUESTION DU PRIX

**Envoi réel** : `send-otp/route.ts:107-114`. Le commentaire du code (l.107-108) affirme :
« MSG 1 = TEMPLATE approuvé order_confirmation_request. Business-initiated, hors fenêtre 24h → DOIT partir
en template (le texte libre serait rejeté). » Variables passées, dans l'ordre :

```
[ prenom , boutique , produitTxt , totalTxt ]
```
- `prenom` = `client.full_name` premier mot (l.101)
- `produitTxt` = `produit ?? ""` (l.105) — **nom du produit**, pas un prix
- `totalTxt` = `Intl.NumberFormat("en-US").format(Math.round(order.total_amount))` (l.104) — **un seul nombre**

**Rendu concret** (en substituant, ex. Ahmed / Boutique X / T-shurt / 3,300) — bloc FR :
```
Bonjour Ahmed 👋
Bonne nouvelle : votre commande chez Boutique X est réservée à votre nom.

🛍️ T-shirt
💰 3,300 DA
📦 Paiement à la livraison · rien à payer maintenant

Voulez-vous procéder à la livraison ?
```

**RÉPONSE À LA QUESTION** : le prix est affiché en **UN SEUL TOTAL** (`💰 {{4}} DA`, une seule ligne,
alimentée par `order.total_amount`). Il n'y a **PAS** de séparation produit + livraison + total.
La ligne `🛍️ {{3}}` juste au-dessus porte le **nom** du produit, pas son prix.

**La décision du 26 juin existe bien dans la doc mais n'est PAS implémentée** :
`LIVRA_MARKETING.md:135` → « 🔴 VAGUE 3 (décision Lamine 26 juin, encore valide) : séparer le prix dans MSG 1
— afficher **prix produit + prix livraison + total** au lieu du seul total. » Le code (template + site d'appel)
n'a qu'un total.

---

## 4. CE QUE LE REPO SAIT DE L'APPROBATION META

**Il n'existe AUCUN registre committé de l'état d'approbation Meta.** Le statut réel n'est connaissable
qu'en interrogeant Meta en live. Ce que le repo affirme, par ordre de fiabilité :

1. **`order_confirmation_request` — traité comme APPROUVÉ / fonctionnel** :
   - `send-otp/route.ts:107` : commentaire « TEMPLATE **approuvé** order_confirmation_request ». C'est le seul
     envoi qui **retourne 502 et bloque** si le template échoue (l.117-121) — le code parie qu'il passe.
   - `scripts/diag-whatsapp-templates.mjs:57` le liste avec l'annotation « **référence : marche** ».
2. **`delivery_completed` — SUSPECT (ne partait pas)** :
   - `scripts/diag-whatsapp-templates.mjs:10-11` : le but du script est « confirmer pourquoi delivery_completed
     ne part pas » ; l.58 l'annote « **suspect** ».
   - ⚠️ Le script est un **outil de diagnostic live read-only**, pas une réponse stockée : il compare la structure
     Meta réelle au code. Il ne dit pas si delivery_completed est approuvé aujourd'hui.
3. **Les 4 autres `delivery_*` + les `order_*` du tunnel — statut non affirmé dans le repo.**
   - `whatsapp.ts:143-146` (commentaire de `sendWhatsAppNotification`) : « les notifications business-initiated
     hors fenêtre (crons, livraison) **échoueront tant que les templates ne sont pas approuvés** ».
   - `CC_RAPPORT.md:465` : « … Lié au switch template-vs-freetext (**templates Meta en review**, cf. mémoire). »
4. **Templates n'existant QUE dans le code (pas d'envoi template, donc jamais soumis comme template en pratique)** :
   les **7 du tunnel** partent en texte libre (`renderTemplateText`). Ils sont **définis** dans le code avec la
   structure `WhatsAppTemplate` (category/buttons/variables) mais **ne sont jamais envoyés via
   `sendWhatsAppTemplate`** → leur forme « template » (boutons compris) n'est utilisée nulle part à l'exécution.
5. **`WHATSAPP_OTP_TEMPLATE_NAME`** (`.env.example:7-8`) est **vide** — commenté « laisser vide = message texte,
   dev uniquement ». (Note : le chemin OTP livreur `sendOtpWhatsApp`/`buildOtpMessage`, whatsapp.ts:106-140,
   est un **texte FR hardcodé**, hors des 13 templates ci-dessus ; il sert `drivers/register` et
   `drivers/resend-otp`, pas le tunnel acheteur.)

**Script pour obtenir le statut réel** (documenté, non exécuté ici — mission lecture seule) :
`scripts/diag-whatsapp-templates.mjs` interroge `message_templates` sur le WABA pour 6 noms
(`order_confirmation_request`, `delivery_completed`, `delivery_perso_enroute`, `delivery_mode_perso`,
`delivery_mode_carrier`, `delivery_failed`) et imprime `status`/`language`/nb de params.

---

## 5. VOCABULAIRE « BOUCLIER »

**Recherche** `bouclier` / `🛡` / `shield` / `درع` dans `src/lib/whatsapp-templates.ts` : **AUCUN match.**
→ **Zéro des 13 templates ne contient de vocabulaire « bouclier ».**

La copy actuelle utilise un autre registre (constaté verbatim en section 2) :
- 🐺 (loup) en signature — MSG 8, MSG 10.
- « client vérifié LIVRA ✓ » / « زبون مؤكَّد LIVRA ✓ » — `order_confirmed_verified`.
- « le livreur de {{boutique}} » (jamais « livreur LIVRA ») — cohérent avec la règle d'en-tête l.7.

« bouclier » n'existe dans le repo que **hors templates** : `src/messages/fr.json:122` (`"eyebrow": "Le bouclier LIVRA"`,
landing) et `src/styles/livra-landing.css:1054` (commentaire de section landing).

**⚠️ Contradiction doc ↔ code** : `LIVRA_MARKETING.md:136` affirme « les 12 templates 26 juin sont codés
(`src/lib/whatsapp-templates.ts`) **MAIS avec l'ANCIENNE copy "bouclier"** ». **Le code contredit ce doc** :
(a) plus aucune trace de « bouclier » dans le fichier ; (b) il y a **13** templates, pas 12
(`order_otp_wrong_code` a été ajouté après — cf. commentaire l.98-102 ; `order_thanks` supprimé le 6 juil
d'après `LIVRA_MARKETING.md:136`). → **`LIVRA_MARKETING.md:136` est périmé sur ce point.**

---

## 6. RÉCAP DES ÉCARTS FACTUELS RELEVÉS (sans avis)

- Les **7 templates du tunnel** partent en **texte libre** (`renderTemplateText` → `sendWhatsAppNotification`),
  jamais en `sendWhatsAppTemplate` → hors fenêtre 24 h, ils ne sont **pas** délivrés (whatsapp.ts:143-146).
  [confirmé sites `confirm-order.ts` l.111/137/234/242/256/293/330]
- **MSG 4** et **MSG 7** définissent des boutons quick-reply **perdus** à l'envoi (texte libre).
- **MSG 1** : prix en **total unique**, la séparation produit/livraison/total (décision 26 juin,
  `LIVRA_MARKETING.md:135`) **n'est pas codée**.
- **`LIVRA_MARKETING.md:136`** est **périmé** : plus de copy « bouclier » dans le code, et 13 templates ≠ 12.
- **Aucun statut d'approbation Meta stocké** dans le repo ; seuls des commentaires de code
  (`order_confirmation_request` = « marche », `delivery_completed` = « suspect ») et la mention
  « templates Meta en review » (`CC_RAPPORT.md:465`).
</content>
</invoke>
