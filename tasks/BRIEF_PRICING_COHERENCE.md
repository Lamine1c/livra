# BRIEF — COHÉRENCE PRICING (repo web `~/livra`)

**Périmètre : 2 fichiers, 2 modifications. Rien d'autre.**
Ne touche à AUCUN autre fichier, à AUCUNE autre valeur de prix.
Le backend (`chargily.ts`, `api/billing/*`, migration 026) est déjà correct — **ne le touche pas**.

---

## MODIF 1 — Le prix barré fictif

**Fichier :** `src/app/[locale]/(site)/pricing/page.tsx`
**Ligne 263** (carte Fondateur, bloc `.pv-price`)

```diff
-                  <span className="pv-strike">1 999</span>
+                  <span className="pv-strike">999</span>
```

**Pourquoi :** `1 999` n'existe nulle part dans le produit. La carte Standard, à 30 cm à droite
sur la même page, affiche `999`. Le prix d'ancrage barré doit être le vrai prix Standard.

⚠️ **Attention rendu :** `999` est plus court que `1 999`. Vérifie que la barre de `.pv-strike`
et l'alignement baseline avec `.pv-amt` (499) tiennent toujours — en FR **et en AR (RTL)**.
Si l'alignement casse, corrige le CSS, ne recule pas sur la valeur.

---

## MODIF 2 — La CGU ment sur le quota Fondateur

**Fichier :** `src/app/[locale]/(site)/cgu/page.tsx`
**Ligne 151** (article 6.2, liste des plans)

```diff
-              <li style={listItem}>{"(a) Plan Fondateur : 499 DA par mois, à vie tant que l'abonnement reste actif sans interruption, dans la limite des 100 premières inscriptions ;"}</li>
+              <li style={listItem}>{"(a) Plan Fondateur : 499 DA par mois, à vie tant que l'abonnement reste actif sans interruption, dans la limite des 50 premières inscriptions ;"}</li>
```

**Pourquoi :** la CGU est le seul endroit du repo qui dit `100`. Partout ailleurs c'est `50` :
- `src/messages/fr.json:48` et `:320` → 50
- `src/messages/ar.json:48` et `:320` → 50
- `supabase/migrations/026_billing_trial_gate.sql:62` → `IF v_count >= 50 THEN RETURN NULL` (**quota strict 50 en base**)

Un document contractuel promettait 100 places quand le système en attribue 50.
Le 51e inscrit avait la CGU de son côté. C'est le seul `100` à corriger.

---

## VÉRIFICATION AVANT DE RENDRE

1. `grep -rn "1 999\|1999" src --exclude-dir=node_modules` → **0 résultat** (hors `9516-1998 Québec inc.`)
2. `grep -rn "100 premières" src` → **0 résultat**
3. `npm run build` passe
4. Screenshot de `/pricing` en **fr** et en **ar** — les deux cartes côte à côte, le barré lisible

**Hors périmètre, ne le fais pas :** le passage de « à vie » à « 6 mois » n'est PAS décidé.
Laisse tous les `à vie` / `مدى الحياة` exactement où ils sont (fr.json 48/316/322/323,
ar.json 48/316/322/323, cgu 151/154/156, SignupModal 27/723, billing-reminder-email 39).
