# SESSION_HANDOFF.md — État vivant LIVRA

**Dernière mise à jour** : 19 juin 2026, 11:00 Alger
**Mis à jour par** : Claudy + Lamine

Fichier à lire en premier au démarrage de toute nouvelle session.
Complète CLAUDE.md (règles permanentes) — celui-ci décrit où on EST.

---

## 📖 FICHIERS À LIRE EN PREMIER

**Réflexe nouveau Claudy** : lire dans cet ordre au démarrage :
1. ~/livra/SESSION_HANDOFF.md (état des faits)
2. ~/livra/CLAUDY_FLOW.md (culture de collaboration)
3. ~/livra/CLAUDE.md (règles du repo web)
4. ~/livra-mobile/LIVRA_ROADMAP.md (vision produit)

---

## 📍 ÉTAT ACTUEL

**Page fermée** : `/telecharger` — commit `3abf606`, 18 juin.
**Page fermée** : `/magazine` + `/magazine/[slug]` — commit `9f2725d`, 18 juin.
**Page fermée** : `/pricing` — mergée sur main, commit `1790656`, 17 juin.
**Page fermée** : `/` (LP) — mergée sur main, commit `7b83ba3`, 16 juin. Port responsive CD export 11 mergé 19 juin (commit `ae3ecea`).

**Phase active** : Backlog CD — demander **export 12** pour porter les TABLET REVIEW FIXES restants (unification titres H2 sections1/2/s4/s5/s6, s2-ghosts ≤1080, s75-credo grid 721-900, respiration sections 721-1080). Harmoniser avec HTML actuel du repo (**sans** dépendance `.hero-cta` wrapper qu'on n'a pas).

**Pas de date de launch fixée.** Lamine veut le site fini desk-tablet-mobile + app polish AVANT de décider quoi que ce soit. Méthode = step-by-step, page par page, lien par lien, bouton par bouton.

---

## 🗺️ CARTE DU SITE (8 pages marketing à fermer)

Site marketing (audit en cours) :
- ✅ `/` (LP) — fermée 16 juin
- ✅ `/pricing` — fermée 17 juin
- 🗑️ `/tarifs` — supprimée, redirige 301 vers `/pricing`
- ✅ `/telecharger` — fermée 18 juin (trust line 5 items + drapeau DZ)
- ✅ `/magazine` + `/magazine/[slug]` — hydration fix 18 juin (Tailwind global décorrélé + date déterministe)
- ✅ `/privacy` — v2 live 17 juin
- ✅ `/cgu` — v2 live 17 juin

Opérationnel acheteur (séparé, audit après le marketing) :
- ⏳ `/track` (suivi public)
- ⏳ `/locate` (partage position)

Technique (pas d'UI) : `/oauth/meta-callback`.

**Méthode d'audit** : une page à la fois, desktop d'abord (tablette et mobile = phase suivante), tous les liens vérifiés, tous les boutons vérifiés, fermée propre avant de passer à la suivante.

---

## 🟢 CE QUI EST LIVE EN PROD

- LP V2 polish complet (zigzag horizontal : Bouclier mirror / Wedge / Confiance mirror)
- `/pricing` (3 cards + Founders counter live `{count, max:100}`, branché sur l'API)
- SignupModal branché backend réel (OTP par email Resend, testé E2E)
- Brand system : Wordmark V3 + Bouclier favicon + OG image
- Backend OTP Sprint 1 + Sprint 2 frontend wiring en prod
- Footer cleané (pas de ligne géo, pas de WA orphelin, Tarifs → `/pricing`)
- Route `/blog` → `/magazine` (avec redirects 301)
- 2 fondateurs test en DB (#1 lamine@golivra.app, #2 godzillamarketing514@gmail.com) → **à wiper avant trafic public**
- Acceptance contractuelle : checkbox CGU obligatoire dans SignupModal, preuve stockée (timestamp + IP + UA + version) dans `vendors_waitlist` (migration 016 appliquée)
- Tarifs alignés 499/999 partout (Fondateur / Standard), annuel retiré
- Header global unifié : HeaderGlobal.tsx sticky onyx+blur appliqué via `(site)/layout.tsx`, palette Onyx v1, active-state propre, Magazine ajouté à la nav (commit `426d99b`, merge `aa80cf3`)
- Footer global unifié : visuel pleine largeur identique LP↔site (inner 1180px), wordmark LIVRA + tagline + copyright Godzii Media, 6 liens cohérents partout (Produit·Tarifs·Magazine·Confidentialité·CGU·Contact)
- Sticky-footer flexbox : `(site)/layout.tsx` en flex flex-col + Footer `mt-auto` → footer épinglé en bas sur pages courtes (/pricing, /magazine)
- `/telecharger` : trust line 5 items (Données chiffrées · Bouclier anti-scam · Position 100% privée · Sans engagement · Made in Bledi avec drapeau DZ SVG couleur), commit `3abf606`
- `/magazine` + `/magazine/[slug]` : décorrélation Tailwind global (main inline + grille `.mag-grid` scopée) + formateur date déterministe (MOIS_FR maison), fin du hydration mismatch, commit `9f2725d`
- Cleanup Phase 1 : -7195 lignes code mort (-19 composants `site/*` orphelins, -12 `.module.css`, -2 libs `supabase/client` + `whatsapp-link`, -2 deps `posthog-js` + `lucide-react`), lint 22→7, commit `e389a7f`
- Drawer mobile fonctionnel ≤1080px : burger animé → croix, overlay plein écran via `createPortal(document.body)` pour sortir du containing block créé par backdrop-filter du `<header>`, scroll-lock + Escape + close-on-route + backdrop click, padding-top:max(72px, env(safe-area-inset-top)) pour notch iOS, background var(--onyx, #0E0E10) opaque, z-index 45 < header 50. Commits `0c6acdf` (vrai fix v2 via portal — root cause identifiée par CD : backdrop-filter blur crée containing block), merge `62263fc`
- Sitemap réparé : /blog (404) → /magazine + /pricing + /telecharger + /magazine listés, articles dynamiques via getAllPosts() → /magazine/[slug]. Commit `f5bce88`, merge `62263fc`
- Cleanup Phase 3 : CSS morte retirée de `livra-landing.css` (-17 lignes : `.nav-*` du header extrait + `.lp-footer-contact-block` + `.lp-footer-wa` du footer refait), `.brand` préservée (vivante dans Pinpoint), commentaire renommé Brand wordmark. Build inchangé. Commit `f9c9a7f`, merge `114f0c8`
- **LP responsive (port CD export 11)** : bloc additif EXPORT 11 en fin de `livra-landing.css` (+39 lignes, zéro existant touché). Fix iPad portrait 768-1024 (`.hero .bg` swarm bulles masqué ≤1080px, `.livemap` remise en flow sous dashboard centrée, `.product` flex column, `.panel` pleine largeur) + mobile ≤720px (overflow-x bloqué, livemap recentrée). Desktop ≥1081px intact. Commit `ae3ecea` (mergé sur main 19 juin). Audit visuel via Claude in Chrome (resize_window + javascript_tool) confirmé pixel-perfect aux 3 breakpoints testables (1024 / 768 / 500 — Chrome bloque <500px, règle CSS identique à 360).

---

## 🟢 CE QUI EST CONSTRUIT (app mobile, audit fait 16 juin)

App fonctionnellement built — vendeur + livreur 100% branchés prod, zéro mock. Audit cc read-only 3 agents.

**Store blockers triviaux (1 session cc)** :
- `ios.buildNumber` absent de `app.json`
- `RECORD_AUDIO` déclaré sans usage → retirer (rejet Apple + Google sinon)
- `EXPO_PUBLIC_DEBUG_TRACKING=1` → override à 0 dans `eas.json` profil prod
- Splash + adaptive icon backgroundColor à passer dark

**Bug ouvert non-bloquant** : B2 — Settings "Mon propre livreur" pas wiré.

**Gates externes (paperasse, pas du code)** :
- Comptes Apple Dev + Google Play Dev pas enrollés (DUNS prêt : `243367811`)
- Twilio sandbox → Meta WA prod (le long pôle, ~2-3 sem)
- GPS background iOS = foreground seulement (TODO V1.1, casse promesse "tracking Uber-style")
- Paiement DZ (Chargily) = 0% code, mais 7-day free trial buffer

---

## 🔴 BUGS / TODOS OUVERTS

### Web — à fixer pendant l'audit page-par-page

~~**Hero LP cassé en iPad portrait**~~ → ✅ FIXÉ 19 juin (port CD export 11, commit `ae3ecea`).

**Cohérence visuelle 721-1080px à demander à CD (export 12)** : unification titres H2 sections1/2/s4/s5/s6 (manche d'escalier actuelle), `.hero-cta` wrapper (visuel avant CTA en stack), `.s2-ghosts` masquées ≤1080 (superposition cartes "pendant ce temps"), `.s75-credo` grid 721-900 (écrasé actuellement), respiration sections 721-1080. Bloc TABLET REVIEW FIXES déjà préparé par CD pour export 7 mais dépend d'un changement HTML qu'on n'a pas. Demander harmonisation avec HTML actuel du repo.

**OG Facebook** — cache stale depuis 6 juin (code correct, juste le CDN). Re-test plus tard.

### Pré-launch web (à régler avant trafic public)

- Wiper data fondateurs test #1 et #2 → counter repart à 100
- CTA "Télécharger l'app" → reframe en waitlist tant que stores empty
- Dropdown indicatifs WhatsApp (diaspora) — actuellement +213 lock

### Pages à confirmer existence

`/contact`, `/faq`, `/a-propos` — roadmap les listait comme pas faites au 18 mai. À checker pendant l'audit.

---

## 🔒 SÉCURITÉ — audit forensique 18 juin (5 sub-agents read-only)

Audit complet web + mobile + DB + sécurité + cohérence. Rapport intégral dans l'historique chat. 3 bombes 🔴 désamorcées ; 🟠 / 🟡 restantes ci-dessous.

### 🔴 Désamorcées — branche `feature/security-3-bombs`, commit `9376498` (à merger)
- **`driver-notify` sans auth** → gaté (`getAuthenticatedUser` + ownership `.eq("user_id")` + garde `driverName`). Était IDOR + spoofing WhatsApp + mutation d'état non-authentifiée.
- **`cancel-delivery` status invalide** → `created`→`confirmed` (`created` violait le CHECK constraint `orders.status` → échec silencieux, commande bloquée en `shipped`).
- **`.env.localnano .env.local`** (copie périmée des secrets LIVE en clair, hors-git) → `rm` à exécuter par Lamine. Rotation des clés = décision humaine séparée (jamais push, donc pas urgent).

### 🟠 ÉLEVÉ — sessions sécurité dédiées à planifier
- **RLS publique GPS** : `deliveries` + `delivery_positions` en `FOR SELECT USING(true)` (migration 006:57-62) → tout l'historique GPS lisible avec la clé anon. À restreindre (les pages publiques utilisent déjà un token signé).
- **Auth livreur faible** : `driver/refresh-token` mint un token depuis `device_id` seul (devinable = mot de passe permanent) ; `driver/check-buyer-location` + `start-delivery` (1er claim) sans vérif d'assignation = IDOR.
- **Schéma prod non versionné** : table `drivers` (jamais de `CREATE TABLE`, hand-créée en Studio) + colonne `orders.otp_sent_at` (lue par `send-otp`, dans aucune migration) → DB non reproductible depuis le repo. Créer les migrations de réconciliation.
- **OTP brute-force** : `orders/[id]/verify-otp` + `drivers/verify-otp` sans cap de tentatives (seul `auth/verify-otp` cap à 3).
- **Mobile — bug perte de données** : déconnexion livreur teste `status="in_progress"` (`(driver)/index.tsx:99`) alors que la recovery teste `"active"` (:34) → un livreur en livraison peut se déconnecter et orpheliner la livraison.

### 🟡 MOYEN — dette (non bloquant)
- OTP vendeur stocké en clair (`otp_codes.code`) vs OTP livreur haché → incohérent.
- Aucun header de sécurité (CSP/HSTS/X-Frame-Options) dans `next.config.ts`.
- Zod sur 3/28 routes API seulement (le reste = validation manuelle ou body brut).
- **Code mort mobile** (web fait en Cleanup Phase 1, commit `e389a7f`) : deps mortes côté `~/livra-mobile` à désinstaller — `react-native-maps`, `expo-haptics/image/symbols/font`.
- Société « Québec » (CGU/Privacy) vs « Quebec » (footers) — accent incohérent.

---

## 🟡 PARKÉ POUR LAUNCH 2 (ne rien faire avant)

### Meta Business Verification — la vraie voie

Meta veut : nom légal + téléphone sur le **même** document, daté 3-6 mois.

- ❌ Bell : compte à l'ancienne cie, refuse de changer → impasse
- ❌ Relevé bancaire Desjardins : pas de tél dessus
- ❌ DUNS : sert pour Apple/Google/Microsoft, **PAS pour Meta** (erreur déjà commise dans l'autre chat, corrigée)
- ❌ Fongo : compte au nom perso, factures à 0 $, pas exploitable
- ✅ **VoIP business** (OpenPhone / Dialpad / RingCentral / Fongo Workplace à vérifier) avec inscription au nom exact "9516-1998 Québec inc." → première facture = nom + tél sur même doc
- ✅ **Boîte postale virtuelle** (Postes Canada à creuser ou alternative) → adresse business propre côté address de la vérif

**Règle** : un seul bon doc, légitimement obtenu. Pas une rafale de 2-3 abonnements bidon (anti-fraud Meta = permaban).

### Autres parkés Launch 2
- 360dialog (€49/mo) : gated par Meta verification
- Apple Dev + Google Play Org enrollment (DUNS débloque, mais on enrolle quand on est prêt à soumettre)
- GPS background iOS
- Chargily DZ paiement

---

## 💡 IDÉES STRATÉGIQUES CAPTURÉES (backlog)

### Le vrai moat de LIVRA = la donnée collective scammers

- Marché : ~200K vendeurs e-commerce DZ actifs. 30% × 999 DA/mo ≈ 5,3M USD ARR si 30% adoption. Même 5-10% = gros.
- **Collecte commence MAINTENANT, passive** : le flow OTP+livraison existant enregistre déjà "OTP confirmé puis ghosting" = signal système-observé propre (Source A).
- Monétisation = V2 : registry/blacklist + dashboard analytics objections + pack premium.
- V2 features : bouton "signaler scammer" vendeur (Source B, déclaratif, risqué), auto-blacklist après 3 ghosts system-observed, popup "client à risque" pré-commande, droit de réponse acheteur (legal shield).
- **Le moat = effet réseau** : un cloner de code part avec blacklist vide. Toi dans 6 mois t'as la carte des arnaqueurs DZ.
- **Boussole de priorité** : tout ce qui accélère l'accumulation de données (+ vendeurs actifs, + livraisons via LIVRA) = stratégique.

### V1.5 backlog
- Pre-departure buyer confirmation WhatsApp ("livraison sous peu, prêt·e?" + refus capture + save-the-sale discount + buyer trust score)
- Page recrutement livreur `/livreur` ("Sois le premier livreur LIVRA dans [wilaya]")

---

## 🤝 LA QUADRILLE (qui fait quoi)

- **Lamine** : vision + décisions DZ + œil œuf de loup
- **Claudy (chat)** : stratégie + specs + briefs cc/CD
- **Claude Design (CD)** : mockups HTML/CSS, **ne touche jamais le repo**
- **Claude Code (cc)** : terminal, production, git
- **cc tourne en Opus 4.8 + 1M context + Max** (upgrade 16 juin)

**Méthode "ceinture + bretelles"** : branche dédiée → diff montré → validation Lamine → commit → push → preview Vercel → validation visuelle → merge sur main.

---

## 📐 RÈGLES TECHNIQUES CLÉS (rappel — voir CLAUDE.md pour la version complète)

- **Repo `~/livra` = WEB UNIQUEMENT.** Repo `~/livra-mobile` = app native.
- **Palette LP marketing = Onyx v1** (terracotta + ivoire + glassmorphism). **JAMAIS d'emerald** sur surface marketing.
- **Pas de login web**. "Se connecter" → `/telecharger`.
- **Pas de hex hardcodé** — toujours via CSS variables.
- **Git DZ** : `git config --global http.version HTTP/1.1` activé en permanence (throttling port 443).
- **2 root causes architecturales documentées** (apprentissages durs) :
  1. SVG `preserveAspectRatio="none"` → overlay en `%` viewBox-derived, jamais en pixels CSS
  2. Crop vertical mockup → vérifier hauteur interne fixe AVANT de chercher du côté grid

---

## 📌 LEÇONS APPRISES

- **Bug visuel/CSS mobile = consulter CD AVANT cc.** CD a tranché en 30 sec le containing block du `backdrop-filter` qu'on cherchait depuis 1h avec cc. Pour bugs visuels, CD est expert ; cc exécute.

- **Extension Anthropic Filesystem** (Claude Desktop > Settings > Développeur > Extensions) = accès direct au FS Mac. À ne pas confondre avec un MCP custom configuré via npx (qui tourne dans sandbox container Linux). L'officielle est marquée "Ce serveur est géré par une extension" + commande "node" (pas "npx"). Setup : install l'extension + active les permissions outils lecture/écriture dans Connecteurs.

- **Claude in Chrome** (resize_window + javascript_tool) = audit visuel pixel-perfect aux breakpoints. Mesures `getBoundingClientRect()` + `getComputedStyle()` plus rigoureuses qu'un screenshot. Permet de prouver le bon rendu en pixels (livemap.top vs panel.bottom, scrollWidth vs clientWidth, etc.). Chrome bloque sa fenêtre à largeur min 500px → pour tester strict <500px, faut DevTools mode device.

- **Grinta Lamine** = ne pas accepter "cul-de-sac" technique sans avoir exploré toutes les options. Cas 18→19 juin : Claudy avait dit MCP filesystem ne marcherait pas (sandbox container), Lamine a creusé le matin suivant et trouvé l'extension Anthropic Filesystem officielle dans Settings. Game changer.

- **Nouveau workflow loup** (validé 19 juin) : Claudy lit/écrit FS Mac direct (SESSION_HANDOFF, CLAUDY_FLOW, code repo, exports CD) + audit visuel pixel-perfect via Claude in Chrome. cc = git + npm + tsc + builds + commits + merges. Vélocité 10× vs avant.

---

## 🎯 PROCHAINS MOVES (ordre strict)

1. ~~CD livre export 11 responsive~~ → ✅ DONE 19 juin (port mergé, commit `ae3ecea`)
2. **Demander CD un export 12** — TABLET REVIEW FIXES harmonisé pour HTML actuel du repo (titres H2 uniformes + s2-ghosts ≤1080 + s75-credo grid 721-900 + respiration sections 721-1080 ; **sans** dépendance `.hero-cta` wrapper qu'on n'a pas)
3. **Port export 12** quand livré (même méthode : audit Claudy via Filesystem + Claude in Chrome → édit direct → cc commit)
4. **App polish** (5 store blockers triviaux mobile)
5. **Enrollment Apple Dev + Google Play** (124 USD)
6. **Décision date launch**

---

**Règle d'or** : ne pas sauter d'étape. Une chose à la fois. Une baffe à la fois.
