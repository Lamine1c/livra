# CLAUDY_FLOW.md — Culture de collaboration Lamine × Claudy

Fichier vivant qui capture le **flow** entre Lamine et Claudy (au-delà des faits techniques de SESSION_HANDOFF). À lire en plus de SESSION_HANDOFF.md + CLAUDE.md + LIVRA_ROADMAP.md au démarrage d'une nouvelle session.

**But** : que le nouveau Claudy arrive avec la **culture** de collaboration, pas juste les faits.

---

## 18 juin 2026

- **[Workflow]** Bug visuel CSS mobile → consulter CD AVANT cc. CD a tranché le containing block du backdrop-filter en 30 sec ; cc et Claudy cherchaient depuis 1h. Pour bugs visuels, CD est expert ; cc exécute.

- **[Tone Lamine]** "Paresseux vaaaa !!!" → quand Claudy donne 3 options polies (A/B/C) au lieu d'une reco nette de loup, c'est qu'il a fauté. Tranche, propose une seule direction, Lamine te dira non si t'es à côté.

- **[Anti-pattern cc]** Sans brief explicite "PAS DE STASH, PAS DE SWITCH DE BRANCHE", cc fait des messes (vu 2× le 18 juin : telecharger drapeau stashé sans terminer, magazine branche créée du mauvais commit). Inclure cette règle dans CHAQUE brief cc.

- **[Tech]** Vercel deploy mapping : commit → deploy en ~10-15s. Si Lamine voit un bug, vérifier QUEL commit est build avant de diagnostiquer (terminal via vercel CLI > Vercel dashboard).

- **[Anti-pattern Claudy]** Diagnostic CSS sans DevTools = spéculation. J'ai dit "var(--onyx) absent" alors que c'était un containing block créé par backdrop-filter. Ne pas spéculer sur du CSS sans inspecter les valeurs computed.

- **[Marché DZ]** Commentaires FB type "c bien fait pour vous, vous faites de l'argent sur notre dos" = signal d'un manque de confiance bidirectionnel dans l'écosystème, PAS une mentalité de revanche. Trust Layer V1 (LIVRA Verified + évaluations bidirectionnelles) = la vraie réponse. À noter dans le copywriting Trust Layer.

- **[Workflow]** Pour debug image-heavy : ouvrir un chat secondaire comme "œil descripteur". Lamine briefe l'autre Claudy avec des questions précises (ex: "fond opaque ou transparent ? items visibles ?"). L'autre répond en texte structuré. Lamine relaie ici. Économise le quota images de la conversation principale.

- **[Workflow]** Audit forensique read-only AVANT toute suppression de code mort. Grep rigoureux par fichier, prouver 0 consumer vivant. cc a flag honnêtement l'impact bundle nul (déjà tree-shaké) — accepter cette honnêteté.

- **[Anti-pattern Lamine]** Tendance à dire "pause" mais en réalité veut continuer si Claudy propose la suite. Confirmer une fois mais respecter le "non". Ne pas pousser.

- **[Vraie reco loup]** Quand Lamine demande "A ou B ?", donner UNE direction nette. Pas un essai. Pas 4 options polies. C'est exactement ce que demande le manifesto.

- **[Tech]** Pour cleanup CSS morte : grep className="<classe>" + className=`...<classe>...` + className={... "<classe>" ...}. Distinguer .class (style mort) vs <tag> (HTML vivant) vs .class-prefix-* (variantes). cc l'a fait proprement en Phase 3.

- **[Workflow]** 3 phases de cleanup post-audit = 3 branches séparées avec checkpoints. Plus de friction = moins de mess de branches. Confirmé sur 18 juin (Phase 1+2+3 toutes mergées sans accroc grâce à la séparation).

- **[Workflow]** Port responsive = NE PAS porter aveuglément les exports CD. D'abord ouvrir l'HTML CD ET screenshot la prod actuelle sur le même viewport (iPad portrait/landscape). Si les 2 sont cassés au même endroit = CD a la même cause root que la prod (positionnement absolu desktop). Demander à CD de FIX avant de porter, sinon cc va répliquer les bugs.

- **[Tech]** Bugs responsive iPad portrait (768-1024px) = positionnement absolute desktop qui déborde. Pattern récurrent sur la LP : bubbles et cards en absolute avec coords desktop. Fix doit être un layout flexbox/grid empilé propre au breakpoint portrait.

- **[Workflow CD]** Quand CD prétend qu'un fix est déjà appliqué mais que le rendu prouve le contraire, demander captures avant/après EXPLICITES aux breakpoints précis du bug. Pas de discussion abstraite.

---

## 19 juin 2026

- **[Tech]** Extension officielle Anthropic Filesystem (Claude Desktop > Settings > Développeur > Extensions) donne accès filesystem direct au Mac. À NE PAS confondre avec un MCP server custom configuré via npx qui tourne dans le sandbox container. L'extension officielle est marquée "Ce serveur est géré par une extension" + commande "node" (pas "npx"). Setup : install l'extension, puis active les permissions outils lecture/écriture dans Connecteurs.

- **[Tone Lamine]** GRINTA — quand Lamine se met un truc en tête ET sent que c'est faisable, il lâche pas tant que c'est pas done. Si Claudy dit "cul de sac, abandonne", mais Lamine sent que c'est faisable, RESPECTER et chercher la vraie solution. Cas 18→19 juin : Claudy avait dit "MCP filesystem ne marchera pas sur Claude Desktop, c'est une limite architecturale". Lamine a dormi, creusé le matin suivant, trouvé l'extension officielle Filesystem dans Settings > Développeur. Game changer.

- **[Workflow]** Nouveau workflow après extension Filesystem activée : Claudy lit le FS Mac direct (SESSION_HANDOFF, CLAUDY_FLOW, CLAUDE.md, code du repo) sans copier-coller. cc continue d'exécuter les édits/commits/builds (git, npm, tsc). Vélocité 10× vs avant.

- **[Anti-pattern Claudy]** "Cul de sac" prononcé trop vite = manque de creusement. Avant de fermer une porte technique, EXPLORER toutes les options Settings/Extensions de l'app. Hier j'ai accepté une "limite architecturale" qui n'existait pas — c'était juste un toggle Extension dans Settings que je n'avais pas cherché. À garder en tête : la grinta de Lamine vaut souvent mieux que ma résignation technique prématurée.

- **[Tech]** `display:contents` + `order` pour réordonner les enfants d'un conteneur sans toucher l'HTML. `parent { display:contents; }` lève ses enfants dans le flex grand-parent ; chaque enfant peut être repositionné via `order`. Scopable par media query, support Chrome/Safari/Firefox 100%. Cas LIVRA export 12 : hero CTA reorder 721-1080 (produit AVANT cta) sans wrapper HTML — le mobile ≤720 reste CTA-first et le desktop ≥1081 garde la grille 2 cols native intacte. Fix élégant quand l'HTML repo ne matche pas la structure attendue par le mockup CD.

- **[Workflow]** Port CD multi-fichier (CSS additif + markup JSX) validé sur export 12 : Claudy applique les 2 edits via Filesystem direct (dryRun → apply), cc enchaîne tout le pipeline en UN brief (`checkout -b → tsc → build → lint → diff → commit → push → audit Chrome Claudy → merge --no-ff → cleanup branche locale+remote → vérif prod Ready`). Zéro friction, zéro mess de branches. Cas 19 juin : port `9bac3be` → merge `ccd43f6`, prod build 31s.

- **[Workflow CD]** CD verrouillé à 924px (tablette) pour ses proofs HTML — c'est sa zone la plus dense où vivent tous les fixes responsive. Suffisant pour valider les sélecteurs et la cohérence DOM. Claudy fait l'audit final aux 5 breakpoints via Claude in Chrome (1440/1024/768/500). Les 2 vues sont complémentaires : CD prouve le contenu à 924px, Claudy prouve le rendu cross-BP.

---

## Légende catégories

- **[Workflow]** : process opérationnel entre maillons Quadrille
- **[Tone Lamine]** : reflex langage / signaux du loup
- **[Anti-pattern cc]** : pièges récurrents de Claude Code à briefer contre
- **[Anti-pattern Claudy]** : mes propres erreurs récurrentes à éviter
- **[Marché DZ]** : intuitions ou verbatims terrain à intégrer
- **[Tech]** : leçons techniques apprises sur la stack
- **[Vraie reco loup]** : exemples de bonnes réponses tranchantes
