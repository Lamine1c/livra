#!/bin/bash
# boucle.sh — réveille cc UNIQUEMENT quand tasks/COMMANDE.md a changé.
# La ronde est faite par bash (gratuite). cc ne s'allume que s'il y a du travail.
#
#   Lancer  :  bash tasks/boucle.sh
#   Arrêter :  Ctrl-C
#   Journal :  tasks/boucle.log
#
# ⚠️ Les actions irréversibles (push, deploy, merge, supabase, reset) sont refusées
#    par .claude/settings.local.json (liste "deny"). Elles passent par Lamine.

set -u
cd "$(dirname "$0")/.." || exit 1

CMD="tasks/COMMANDE.md"
SIG=".claude/.derniere-commande.sig"
FIRST=".claude/.boucle-demarree"
LOG="tasks/boucle.log"
INTERVALLE=60

mkdir -p .claude
[ -f "$CMD" ] || { echo "🔴 $CMD introuvable"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "🔴 'claude' introuvable dans le PATH"; exit 1; }

echo "▶ Boucle démarrée — $(pwd)"
echo "  Surveille : $CMD   ·   Ronde : ${INTERVALLE}s   ·   Journal : $LOG"
echo "  cc ne se réveille QUE si le fichier change. Ctrl-C pour arrêter."
echo

# Au démarrage on prend l'empreinte actuelle SANS réveiller cc :
# la boucle ne se déclenchera qu'au PROCHAIN changement écrit par Claudy.
[ -f "$SIG" ] || shasum -a 256 "$CMD" | awk '{print $1}' > "$SIG"

while true; do
  NOUVEAU=$(shasum -a 256 "$CMD" | awk '{print $1}')
  ANCIEN=$(cat "$SIG" 2>/dev/null || echo "")

  if [ "$NOUVEAU" != "$ANCIEN" ]; then
    echo "[$(date '+%H:%M:%S')] ✦ COMMANDE.md a changé → réveil de cc"

    # 1er tour = session NEUVE (pas de --continue, sinon il reprend un vieux contexte).
    # Tours suivants = --continue pour garder le fil.
    SUITE=""
    [ -f "$FIRST" ] && SUITE="--continue"

    claude -p "Lis tasks/COMMANDE.md en entier. Exécute UNIQUEMENT les commandes dont l'ID n'est pas déjà présent dans tasks/RAPPORT.md. Respecte les 6 règles du protocole en tête de COMMANDE.md et le protocole en tête de CLAUDE.md. Quand tu t'arrêtes — pour QUELQUE raison que ce soit : fini, question, doute, blocage, découverte — tu écris tasks/RAPPORT.md AVANT de rendre la main, le plus récent en haut. C'est le seul canal : ce qui n'est pas dans le rapport n'existe pas." \
      $SUITE \
      --permission-mode acceptEdits \
      --allowedTools "Read,Edit,Write,Glob,Grep,Task,TodoWrite,WebFetch,WebSearch,Bash(git add *),Bash(git commit *),Bash(git checkout *),Bash(git branch *),Bash(git tag *),Bash(git status*),Bash(git log*),Bash(git diff*),Bash(git show*),Bash(git stash*),Bash(npx tsc *),Bash(npm run *),Bash(npx expo *),Bash(node *),Bash(grep *),Bash(rg *),Bash(cat *),Bash(ls *),Bash(head *),Bash(tail *),Bash(wc *),Bash(find *),Bash(python3 *)" \
      2>&1 | tee -a "$LOG"

    CODE=${PIPESTATUS[0]}
    if [ "$CODE" -eq 0 ]; then
      echo "$NOUVEAU" > "$SIG"
      touch "$FIRST"
      echo "[$(date '+%H:%M:%S')] ✓ tour terminé — rapport dans tasks/RAPPORT.md"
    else
      echo "[$(date '+%H:%M:%S')] 🔴 cc a rendu le code $CODE — l'empreinte n'est PAS enregistrée,"
      echo "                    la commande sera retentée au prochain tour."
    fi
    echo
  fi

  sleep "$INTERVALLE"
done
