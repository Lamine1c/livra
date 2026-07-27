# BRIEF cc — DÉBLOQUER LE GATE LIVREUR TOUR 3 (27 juil)

## POURQUOI CE BRIEF
Le gate du tour 3 est **structurellement impossible sur preview Vercel**.
Raison vérifiée dans le code, pas supposée :

- `~/livra-mobile/.env` → `EXPO_PUBLIC_API_BASE=https://golivra.app`
- `app/(driver)/livraison-en-cours.tsx:292` → `fetch(\`${API_BASE}/api/driver/cancel-delivery\`)`

→ **L'app iPhone tape `golivra.app` = `main` = l'ancien code.** Elle ne touchera
jamais la preview `livra-app-dz-26-git-feature-dr-2cca02...vercel.app`, quoi qu'on
fasse sur le device. En plus la preview a **Deployment Protection = Standard** :
même en repointant l'app, elle recevrait du 401.

Preuve de l'ancien comportement, sur `main` aujourd'hui :
`src/app/api/driver/cancel-delivery/route.ts:76` → `.update({ status: "confirmed" })`
et **zéro** occurrence de `push`, `whatsapp` ou `reason` dans tout le fichier.

## POURQUOI LE MERGE EST SÛR ICI
`git diff main..feature/driver-refusal-reasons --name-only` = **3 fichiers, tous
confinés au chemin livreur** :
1. `src/app/api/driver/cancel-delivery/route.ts`
2. `src/lib/push-messages.ts`
3. `supabase/migrations/029_delivery_refusals.sql` (**déjà appliquée en prod** le 26 juil)

Aucun fichier du tunnel vendeur/acheteur, aucun fichier de la LP, aucun fichier i18n.
Build preview vert (41 s, Ready). Migration déjà en base → zéro désynchro DB.
Seul comportement modifié : `cancel-delivery` passe de `confirmed` → `returned`,
+ push vendeur + WhatsApp acheteur. Ce chemin est **muet en prod aujourd'hui**,
donc on ne peut rien casser qui fonctionne.

## LES 3 ACTIONS, DANS CET ORDRE

### 1. SÉCURISER LE MOBILE (5 s) — à faire en premier
La branche `design/neumorph-driver` (4 commits : tours 1-2-3 + docs `0f78c12`)
**n'existe que sur le disque du Mac**. Vérifié : absente d'`origin`.
```
cd ~/livra-mobile && git push -u origin design/neumorph-driver
```
Ne touche pas `main`. Risque nul.

### 2. MERGER LE WEB SUR MAIN + DÉPLOYER EN PROD
```
cd ~/livra && git checkout main && git pull
git merge --no-ff feature/driver-refusal-reasons
git push origin main
npx vercel --prod
```
Attendre `● Ready` avant de passer à l'étape 3.

### 3. VÉRIF POST-DEPLOY AVANT DE PRÉVENIR LAMINE
```
git show main:src/app/api/driver/cancel-delivery/route.ts | grep -c "returned"
```
Doit renvoyer ≥ 1. Si 0 → le merge n'a pas pris, STOP et signale.

## CE QUE TU NE FAIS PAS
- Ne pas merger la branche **mobile** — elle attend le gate device de Lamine.
- Ne pas toucher `EXPO_PUBLIC_API_BASE`. Il reste sur `golivra.app`.
- Ne pas désactiver la Deployment Protection Vercel.
- Ne pas modifier `CC_RAPPORT.md` avec un statut « gaté » : le gate n'a pas eu lieu.

## APRÈS TON RENDU
Rappels de Lamine pour ce démarrage :
- Le **token vendeur test est DÉJÀ vérifié** (`test1` a son `ExponentPushToken`,
  contrôlé le 26 juil au soir). Ne pas refaire le check.
- Resync l'en-tête de date de `CC_RAPPORT.md` : il dit encore « ÉTAT AU 22 JUIL »
  alors que le corps contient les tours 1-2-3 du 26.
