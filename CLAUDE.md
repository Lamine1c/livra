# CLAUDE.md — Règles permanentes du repo LIVRA web

Lu par Claude Code à chaque session. Règles forgées par l'expérience et
les erreurs passées. À respecter SANS exception.

## 🔴 RITUEL DE DÉMARRAGE DE SESSION (à faire AVANT tout le reste)

À chaque **nouvelle session**, lis dans cet ordre avant de coder :

1. **`~/livra/CC_RAPPORT.md`** — ton dernier rendu : l'état exact du
   chantier, ce qui est mergé, ce qui reste, les décisions prises.
2. **`~/livra-mobile/HANDOFF.md`** — la Colonne de lancement + l'état
   vivant du projet (briques, bugs ouverts, doctrine).
3. **`~/livra-mobile/BACKLOG.md`** — tout ce qui est parké (chemin absolu,
   c'est l'autre repo). ⚠️ **Presque tout le parké WEB vit ICI** : page
   `/livreur/rejoindre` (404), `/api/settings/yalidine/test`, trou du flow
   refus client, slice web (webhook Meta + replay + `paid_until`),
   enforcement abonnement. Un cc web qui saute ce fichier ne les voit jamais.
4. **Ce fichier `CLAUDE.md`** — les règles du repo.

Puis **dis où on en est et ce qui reste** — avant d'écrire la moindre
ligne de code.

⚠️ **À LA FIN DE CHAQUE RENDU** : mets `~/livra/CC_RAPPORT.md` à jour
(écrasé à chaque fois, Markdown, miroir du chat). C'est le mécanisme de
mémoire entre sessions — si le contexte se compacte ou plante, tout ce
qui compte doit être dans ce fichier.

## AVANT D'AGIR (lecture obligatoire)

Avant TOUTE modification de code, lis attentivement et intégralement :

1. **Ce fichier CLAUDE.md** — relire si plus de 30 min depuis la
   dernière lecture de la session.
2. **Tous les fichiers que tu vas modifier** — pas un survol, lecture
   complète. Si le fichier est long, lis au moins les ~50 lignes
   autour de chaque point d'édition pour comprendre le contexte.
3. **Tous les fichiers de référence dans un bundle CD** (README,
   `CC-PORTING-NOTES.md`, HTML mockup, CSS source). Pas un coup d'œil —
   analyse.
4. **L'historique git récent** (`git log -p -5 <fichier>`) quand tu
   touches à du legacy non documenté.

Si une instruction te paraît contredire un fichier de référence :
**STOP.** Demande à Lamine ou Claudy avant de procéder.

## RÈGLE DES 2 TENTATIVES

Si un fix ne résout pas le problème après 2 tentatives :

- **STOP toute autre tentative.**
- Reviens à l'état d'avant.
- Cherche la cause ROOT au niveau **architectural**, pas cosmétique :
  - Le bug est-il dans le code que tu vises, ou en amont (attributs
    SVG, pipeline de rendu, systèmes de coordonnées CSS, etc.) ?
  - Les hypothèses de tes 2 premières tentatives partagent-elles un
    présupposé commun qui est faux ?

**Exemple réel à mémoriser** : le hero orange dot a pris 3 tentatives
ratées (`left:248px` → `left:calc(248/288*100%)` →
`offset-path:100%`) avant que CD diagnostique le vrai problème : le
SVG route utilise `preserveAspectRatio="none"` qui étire le path,
mais les coords CSS sont en pixels bruts non étirés. Les 3 tentatives
partageaient toutes le même faux présupposé (le path n'est PAS étiré).
Solution : ancrer les dots en `%` dérivés du viewBox.

## ARCHITECTURE INVIOLABLE

- **Ce repo (`~/livra`) = SITE WEB UNIQUEMENT.** LP, /pricing,
  /telecharger, /privacy, /cgu, /magazine, pages tracking acheteur
  publiques (/track, /locate), API auth signup vendeur. ZÉRO flow
  opérationnel vendeur/livreur sur web.
- **App native = repo `~/livra-mobile`** (Expo SDK 54). Vendeur +
  livreur 100% in-app. Ne JAMAIS proposer un flow opérationnel web.
- **Pas de login web.** "Se connecter" → `/telecharger` (l'utilisateur
  télécharge l'app et se connecte dedans).

## PALETTE & DESIGN

- **LP marketing = Onyx v1 + glassmorphism + terracotta.** Tokens dans
  `src/app/globals.css` :
  - `--onyx #0E0E10` (bg page)
  - `--surface #161618` (cards solides)
  - `--deep #0A0A0C` (bg deeper, inputs)
  - `--terracotta #D97757` (accent, max 1 par écran)
  - `--ivoire #F5F0E8` (texte primaire)
  - `--mist #8A8A8E` (texte secondaire)
- **JAMAIS d'emerald sur surface marketing.** L'emerald est réservé à
  l'app native.
- **États succès/erreur = terracotta ou ambre, jamais vert.**
- **Pas de hex hardcodé dans le code.** Toujours via CSS variables.

## RÈGLES ANTI-MENSONGE (AUDIT)

Un self-audit est une PREUVE, pas une déclaration.

- ❌ "Piège X — Pas de min-width manquant. Géré par le translateX."
- ✅ "Piège X — `.s5-stage { min-width: 0 }` ligne 3192. Triptyque
  880px peut désormais shrinker dans grid column 786px."

Pour chaque case d'une checklist (README CD, CC-PORTING-NOTES.md,
audit demandé) :
- Cite la LIGNE EXACTE dans ton code où le point est résolu.
- Si tu ne peux pas citer une ligne, c'est que tu n'as pas appliqué
  le fix. N'écris JAMAIS "✅ géré" sans preuve ligne+fichier.

## RÉFLEXES CSS

- **Grid item qui re-parente un mockup CD (triptyque, dashboard) →
  `min-width: 0` AUTOMATIQUE.** Sinon le contenu intrinsèque > la
  colonne → overflow / clip latéral. Exemples canoniques :
  `.s4-stage`, `.s5-stage`, `.s6-stage` en grid layout.
- **MAIS : un crop VERTICAL d'un mockup vient souvent de la hauteur
  interne fixe de la coque, PAS de la grid.** Vérifie d'abord la
  hauteur du contenu interne vs hauteur de l'écran téléphone +
  border-radius. (Cf. mockup "Une seule app" — content 686px dans
  écran 692px avec border-radius:42px qui bouffait les coins du CTA
  WhatsApp.)
- **`!important` cosmétique = anti-pattern.**
  - "Je rajoute `!important` pour gagner" → STOP. Cause root ailleurs.
  - Un `!important` existant qui bloque → enquêter sa raison AVANT
    d'en ajouter un. Souvent legacy cosmétique à retirer.
- **Spécificité bat l'ordre.** `.section1 .lp-cta-wrap` (0,2,0) gagne
  contre `.lp-cta-wrap` (0,1,0) sans `!important`.
- **Pas d'`overflow:hidden`, `filter`, ou `transform` sur un ancêtre
  3D.** Casse le contexte `preserve-3d` et flatten les mockups.
- **SVG avec `preserveAspectRatio="none"` → le contenu est étiré.**
  Positionner des éléments overlay en pixels CSS bruts ne marchera
  pas. Utiliser des coords en `%` dérivés du viewBox.

## PORT DE MOCKUPS CD

Quand un bundle CD est livré dans `~/Downloads/design_handoff_*` :

1. Lire `CC-PORTING-NOTES.md` EN PREMIER (si présent). Pas un survol —
   applique chaque piège, point par point.
2. Lire `README.md` ensuite.
3. Visualiser le HTML mockup (`*.html`) avant de coder.
4. **Scope CSS strict sous la classe section parente** (`.section1`,
   `.section4`, `.s5`, `.s6`). JAMAIS de classes génériques (`.row`,
   `.card`, `.map`, `.msg`, `.nm`) partagées entre composants.
5. **Visuels statiques uniquement** — pas de bindings de données, pas
   d'i18n, pas d'onClick fonctionnels sur les mockups.
6. **Conserver `opacity: 1 !important`** sur les hero cards et
   mockups (anti-écran-blanc).

## BACKEND / API

- **`SUPABASE_SERVICE_ROLE_KEY` UNIQUEMENT côté server.** Jamais
  exposée client-side.
- **Client Supabase admin = lazy-init.** Factory `createAdminClient()`
  appelée DANS le handler, jamais au module level — sinon le build
  pète quand les env vars ne sont pas présentes au build time.
- **Validation Zod sur TOUS les inputs API.**
- **Pas de catch silencieux.** Jamais `.catch(() => {})`. Toujours
  logger ou propager avec un statut HTTP cohérent.
- **Migrations SQL = fichier versionné**
  (`supabase/migrations/XXX_*.sql`). Appliquées via SQL Editor
  Supabase manuellement, pas via Studio UI ad-hoc.
- **CORS strict** sur les routes auth/signup : origine `golivra.app`,
  pas `*`.

## FRONT-END

- **Pas de `localStorage` / `sessionStorage`.** State React uniquement.
- **TypeScript strict.** Pas de `any`. `npx tsc --noEmit` propre
  obligatoire avant chaque diff.
- **Loading + error states sur CHAQUE appel réseau.**

## WORKFLOW

1. **Diff d'abord, commit après validation Lamine.** Jamais de commit
   sans diff montré + validation explicite.
2. **1-2 fixes max par session pour les visuels.** Pas de
   parallélisation sub-agents quand les fixes partagent du CSS —
   chaque sub-agent croit son truc OK, l'ensemble visuel casse.
3. **Sub-agents OK pour fichiers indépendants.** Pas pour reworks
   visuels couplés.
4. **`npx tsc --noEmit && npm run build` verts AVANT diff final.**
5. **Branche dédiée par sprint**
   (`feature/sprint-N-xxx`, `feature/lp-polish`). Pas de commit
   direct sur `main` jour de prod.

## GIT — RÉSEAU DZ

Si `git push` timeout port 443 (throttling ISP DZ fréquent) :

    git config --global http.version HTTP/1.1

Garder ce réglage activé en permanence. `nc -zv github.com 443` peut
répondre `succeeded` alors que le push HTTP/2 hang.

## SOURCES DE VÉRITÉ

- `~/livra-mobile/BACKLOG.md` + `~/livra-mobile/HANDOFF.md` — **état vivant
  et parké : la vérité en premier** (ce qui est fait, ce qui reste, décisions).
- `LIVRA_BIBLE.md` — architecture produit
- `CLAUDE.md` (ce fichier) — règles permanentes
- `LIVRA_ROADMAP.md` — ⚠️ **historique horodaté SEULEMENT** : le projet le
  déclare périmé (couches contradictoires, refonte au backlog). Ne pas s'en
  servir comme priorités actuelles — c'est BACKLOG/HANDOFF qui tranchent.
- `src/styles/livra-landing.css` — single source LP CSS
- `src/app/globals.css` — design tokens
- `public/brand/` — SVG sources brand kit (Bouclier + Wordmark +
  Lockup)
- Bundles CD dans `~/Downloads/design_handoff_*` pour les livraisons
  visuelles
