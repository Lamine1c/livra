# CLAUDY_FLOW.md — Culture de collaboration Lamine × Claudy

Fichier vivant qui capture le **flow** entre Lamine et Claudy (au-delà des faits techniques de SESSION_HANDOFF). À lire en plus de SESSION_HANDOFF.md + CLAUDE.md + LIVRA_ROADMAP.md au démarrage d'une nouvelle session.

**But** : que le nouveau Claudy arrive avec la **culture** de collaboration, pas juste les faits.

---

## 26 juin 2026

- **[Anti-pattern Claudy MAJEUR]** Quand on "ferme un template" / une copy / un design, le CODE qui le fait fonctionner fait PARTIE de la tâche. Le 25 juin on a "fermé les 12 templates WhatsApp" mais le code du tunnel OUI→MSG2 n'existait pas, et le caller send-otp utilisait encore l'ancien message. Un feature sans le code qui le déclenche n'est PAS fini. Lamine : "comment tu peux mettre un feature sans le faire fonctionner ?". Leçon : quand on valide un asset (template, copy, mockup), vérifier immédiatement que le chemin de code complet qui l'active existe end-to-end.

- **[Anti-pattern Claudy]** Sur-découpage en "vagues" + ajout d'options non demandées ("Voie 1 / Voie 2") en plein milieu d'une tâche déjà décidée = fait perdre du temps et énerve. Lamine : "je crois que tu travailles dur à me rendre fou". Quand la décision est prise (Option A validée), on EXÉCUTE, on ne ressort pas une alternative.

- **[Anti-pattern Claudy]** Réponses trop longues répétées → Lamine a dû sortir "/focus + /efficacité" et faire relire l'ANTIDOTE en entier. Quand Lamine donne un screenshot + 3 observations, répondre court : accuser réception des bugs, les noter, agir. Pas de pavé explicatif.

- **[Tech bidi arabe]** Un nombre formaté fr-FR ("3 300") contient un espace insécable étroit U+202F qui CASSE le rendu LTR dans une ligne de texte arabe (le moteur bidi ré-ordonne → "300 3"). Fix : Intl.NumberFormat("en-US") ("3,300", virgule, pas d'espace) + wrap \u202A...\u202C. Lisible AR + FR.

- **[Tech test]** Le mobile en test pointe vers golivra.app (prod Vercel) via EXPO_PUBLIC_API_BASE. Donc pour tester un fix BACKEND, il faut promouvoir le bon deploy en PRODUCTION sur Vercel — un fix qui reste en preview est invisible pour l'app. Le switch de version backend ne se fait PAS dans Expo, mais sur Vercel.

- **[Tech Twilio sandbox]** Twilio sandbox envoie les messages entrants en form-urlencoded (From/Body), PAS en JSON Cloud API. Et il répond "You said: ..." tant que l'Inbound URL n'est pas configurée. Les boutons quick-reply OUI/NON ne sont PAS natifs en sandbox (texte simple). Le tunnel complet ne se teste vraiment qu'avec un vrai canal (360dialog).

- **[UX]** Un bouton en style "ghost" (fond surface + bord gris) ne se lit PAS comme un bouton — même Lamine, créateur de l'app, ne l'a pas reconnu. Pour une action principale : style outline avec bord terracotta visible (comme "Se déconnecter" dans Settings). Le CTA plein terracotta, lui, "fait gros et laid" selon Lamine pour ce contexte — l'outline est le bon entre-deux.

- **[Design FLOW-2]** Le vendeur ne tape JAMAIS le code OTP lui-même. Le client confirme via WhatsApp → webhook → Realtime push → l'écran vendeur passe à "Confirmée" tout seul. Toute case de saisie OTP côté vendeur contredit la promesse "le vendeur pourrait dormir". Supprimée.

- **[Sécurité ordre critique]** Quand un fix sécu touche à la fois le code (qui retire les accès anon) ET une migration (qui verrouille la RLS) : merger + déployer le CODE d'abord, migration APRÈS. Inverser = l'app en prod (encore sur l'ancien code qui lit en anon) casse instantanément.

- **[Incident]** Un `git checkout main` après travail sur branche peut reset le working tree d'un doc (HANDOFF) à la version main, puis un commit/push écrase les updates. Conséquence : updates HANDOFF du 25 juin soir perdus. Toujours commit les docs sur la branche où on les édite, ou vérifier l'état du doc avant de switch.

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

- **[Stratégie]** 🔴 **MOBILE-FIRST = LE CŒUR DE LIVRA, JAMAIS UN FALLBACK.** L'acheteur DZ découvre LIVRA via mobile : pub Meta sur Android (Reels/Stories), lien WhatsApp Safari iPhone, Reel TikTok qui clique vers golivra.app. Quasi-jamais un MacBook 1440 plein écran. Donc à 320-768 le hero doit garder TOUTE sa densité immersive (cards arabizi, swarm, livemap flottante, tension visuelle) — c'est le scroll-jugement 1.5 sec qui décide si on perd 90% des prospects. Règle d'or pour tout fix responsive : d'abord se demander "comment je PRÉSERVE la densité sur petit écran ?" avant de penser "comment je cache pour pas déborder ?".

- **[Anti-pattern Claudy]** Approche desktop-first sur EXPORT 11+12 = erreur de framing. J'ai caché `.hero .bg` (10 ghosts + 4 sharp cards) ≤1080 + `.s2-ghosts` (12 cards section 2) ≤1080 pour résoudre les débordements absolute. Trade-off : layout propre mais hero + section 2 VIDES sur mobile/tablet. Résultat : Lamine voit un site moins attractif sur 320-768 que sur 1440 — exactement l'INVERSE de ce qu'il fallait pour le marché DZ mobile-first. La bonne démarche aurait été : reprogrammer le swarm en positionnement responsive (% / max-width strict / safe-zone interne / scale adaptatif) au lieu de simplement le masquer. Le `display:none` responsive est un OUTIL DE DERNIER RECOURS, pas un fix de premier réflexe.

- **[Stratégie]** **Le `.hero-voices` (3 cards stack émergence EXPORT 12) était dans la bonne direction mais trop léger pour compenser la perte de densité.** Vérité prouvée par le rendu live : 3 cards plates ne remplacent pas l'immersion du swarm + ghosts + livemap flottante à 1440. Direction C validée 19 juin : hybride mini-swarm responsive (2-3 ghosts safe en absolute) + `.hero-voices` enrichi (5 cards avec profondeur scale/opacity + pseudo-élément blur silhouette). Pareil section 2 : mini-ghosts safe + mur 6 cards central.

- **[Anti-pattern Claudy]** 🔴 **Diagnostic CSS au pif = récidive.** Export 13.M8 : le `backdrop-filter:none !important ≤720` ne gagnait pas sur les voix. J'ai parié « spécificité » (le socle `.hv-stack .hv-card` battrait `.hv-card`) — FAUX. CD a lu le SOURCE et trouvé le vrai root cause : le socle pose DEUX propriétés (`-webkit-backdrop-filter` + `backdrop-filter`) et mon M8 ne neutralisait que la non-préfixée. Les WebView Android mid-range peignent via le préfixe `-webkit-` → le blur (et le jank) survivaient. `getComputedStyle().backdropFilter` masque le détail préfixé, donc l'audit Chrome seul ne le voyait pas. Leçons : (1) pour tuer un backdrop-filter, neutraliser TOUJOURS les 2 propriétés ; (2) une cascade qui résiste = lire le SOURCE, pas deviner ; (3) reconfirmé une N-ième fois — **bug CSS = CD AVANT Claudy**, c'est lui qui a écrit le socle. Fix dans export 14 (`21d68d2`).

- **[Workflow]** **Audit Chrome 3 plages avant tout merge responsive** (validé export 13/14, 20 juin) : mobile ≤720 (Chrome clampe à 500px logique — règles CSS identiques ≤720 donc 500 valide le mobile), tablette 721-1080 (924px), desktop ≥1081 (1440px). Mesure DOM via `getComputedStyle` + `getBoundingClientRect`, check scroll-X à chaque plage. ⚠️ Piège : `getComputedStyle(enfant).display` retourne le display de l'ENFANT même si le PARENT est `display:none` → faux positif. Pour savoir si un élément est vraiment rendu, checker le PARENT (`getBoundingClientRect` 0×0 = non rendu). Cas 20 juin : les `.hv-card` semblaient « visibles » desktop alors que `.hero-voices` parent était `display:none` (correct, pas de doublon swarm+voix).

- **[Tech]** **Espaces insécables (U+00A0) dans les .md français cassent `edit_file`** (match exact). La typo française insère des insécables avant `:` `;` `!` `?` et parfois autour de `+`. Un `oldText` copié qui « semble » identique échoue (« Could not find exact match »). Contournement : ancrer sur des tokens COURTS sans ponctuation française ni espace interne piégeux — mots majuscules (`PRIORITAIRE`), marqueurs markdown collés (`**MAIS**`), titres ASCII anglais. Découper les gros remplacements de paragraphe en petits edits sûrs.

---

## 24 juin 2026 (session transporteurs)

- **[Anti-pattern Claudy]** **Dérive vers le wedge alors que Lamine est sur les bugs.** Sur une seule session, j'ai poussé 5× vers « on passe au wedge WhatsApp » pendant que Lamine voulait finir les transporteurs à 100%. Lamine a dû me cogner explicitement (« Bro mais qu'est-ce qui se passe », « tu me fais peur là », « tu déconnes comme ça, on change de chat ? »). **Règle absolue : on reste sur la tâche en cours jusqu'à ce que LAMINE dise « on passe à autre chose ».** Pas moi. Manifesto le dit noir sur blanc — et j'arrivais pas à le respecter.

- **[Anti-pattern Claudy]** **Confabulation par enthousiasme.** Après un curl réussi sur la *lib* transporteur, j'ai déclaré « E2E validé ». Faux. Le curl validait la lib, pas le flow app (create + save DB). Lamine teste dans l'app → 4 bugs sortent. **Le E2E n'est validé que quand Lamine crée une vraie commande dans l'app, pas avant.** Curl = test de la lib, pas du flow.

- **[Anti-pattern Claudy]** **Brief faux donné à cc.** J'ai briefi cc en disant « il y a 2 useEffect Realtime dupliqués vers ligne 220-247, supprime la duplication ». cc a vérifié sur disque : **1 seul useEffect**, pas de duplication. cc a refusé de modifier (règle CLAUDE.md respectée — STOP si brief contredit le code) et m'a bloqué. **Le vrai bug était dans le notif tap (`router.push` empilait une 2e instance).** Leçon : **toujours lire le code AVANT de décrire le bug à cc**, pas l'inverse. Et quand cc refuse en disant « le code dit autre chose » → cc a raison, je reverify.

- **[Tone Lamine]** « **Sois simple please** » / « **ça t'a pris 2 lignes** » → quand Claudy déroule un essai pour répondre à une question qui se résout en 2 lignes (ex: « les APIs transporteurs exigent un champ adresse — oui ou non ? »), c'est qu'il a fauté. **Répondre à la question, point. L'analyse vient après si demandée.**

- **[Anti-pattern Claudy]** **Reporter une mise à jour de doc à « demain » à fin de session.** À minuit, j'ai proposé « ROADMAP sera resync demain ». Lamine m'a repris (« on a dit quoi des affaires à reporter »). Le manifesto dit *si c'est devant nos yeux, on le fix maintenant*. **Job permanente Claudy = sync ROADMAP + HANDOFF + CLAUDY_FLOW À LA FIN DE CHAQUE SESSION, jamais le lendemain.**

- **[Anti-pattern Claudy]** **Demander à Lamine s'il a les accès Supabase après 2 mois de chantier.** Question débile qui montre que je perds le contexte de qui Lamine est. Évident qu'il a ses accès. Ne JAMAIS reposer une question fondationnelle qui montre que j'oublie qui est mon partenaire.

- **[Workflow]** **Quand un bug surgit en testant en app, Claudy vérifie d'abord sur disque la cause racine avant de briefer cc.** Le BUG 1 (« erreur de sauvegarde » DHD) → j'ai grep migration 005 → trouvé le CHECK constraint avant de briefer cc. Résultat : brief précis, fix au premier coup. À généraliser : *grep + read avant brief*, jamais brief de mémoire.

- **[Tech]** **Migration en prod = Lamine via SQL Editor, pas cc via CLI.** Lamine préfère garder la main sur la DB prod. Workflow : cc crée le fichier migration, Claudy donne le SQL exact (lu sur disque) + une requête de vérification, Lamine applique et colle le résultat. Confirmation visuelle (`pg_get_constraintdef`) avant de continuer.

- **[Vraie reco loup]** Quand le code commité marche mais le flow app ne marche pas → **ne pas couvrir l'erreur, l'admettre cash** (« le curl validait la lib pas le flow app — je le prends »). Lamine encaisse mieux l'honnêteté brute que l'excuse brodée.

## Légende catégories

- **[Workflow]** : process opérationnel entre maillons Quadrille
- **[Tone Lamine]** : reflex langage / signaux du loup
- **[Anti-pattern cc]** : pièges récurrents de Claude Code à briefer contre
- **[Anti-pattern Claudy]** : mes propres erreurs récurrentes à éviter
- **[Marché DZ]** : intuitions ou verbatims terrain à intégrer
- **[Stratégie]** : principes de positionnement marché / produit (mobile-first DZ, donnée collective scammers, etc.) qui doivent guider TOUTES les décisions techniques
- **[Tech]** : leçons techniques apprises sur la stack
- **[Vraie reco loup]** : exemples de bonnes réponses tranchantes
