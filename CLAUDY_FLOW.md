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

---

## Légende catégories

- **[Workflow]** : process opérationnel entre maillons Quadrille
- **[Tone Lamine]** : reflex langage / signaux du loup
- **[Anti-pattern cc]** : pièges récurrents de Claude Code à briefer contre
- **[Anti-pattern Claudy]** : mes propres erreurs récurrentes à éviter
- **[Marché DZ]** : intuitions ou verbatims terrain à intégrer
- **[Tech]** : leçons techniques apprises sur la stack
- **[Vraie reco loup]** : exemples de bonnes réponses tranchantes
