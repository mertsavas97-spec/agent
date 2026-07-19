#!/usr/bin/env bash
# Deploy Firestore rules + Functions (includes onSolveRequestCreated).
# Mac / owner:
#   gcloud auth login   # and/or: npx firebase login
#   bash scripts/deploy-firestore-solve.sh
#
# npm EACCES (~/.npm root-owned) olursa önce:
#   sudo chown -R "$(whoami)" ~/.npm

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
TOOLS="$ROOT/.tools"
# Avoid broken ~/.npm ownership — use a project-local cache
export npm_config_cache="${TMPDIR:-/tmp}/cozbil-npm-cache-$$"
mkdir -p "$npm_config_cache"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$ROOT"

resolve_firebase() {
  if command -v firebase >/dev/null 2>&1; then
    echo "firebase"
    return
  fi
  if [[ -x "$TOOLS/node_modules/.bin/firebase" ]]; then
    echo "$TOOLS/node_modules/.bin/firebase"
    return
  fi
  echo "→ firebase-tools yerel kuruluyor ($TOOLS)…"
  mkdir -p "$TOOLS"
  npm install --prefix "$TOOLS" firebase-tools@latest --no-fund --no-audit
  echo "$TOOLS/node_modules/.bin/firebase"
}

FIREBASE_BIN="$(resolve_firebase)"
echo "==> firebase: $FIREBASE_BIN"

echo "==> Build functions"
(cd "$ROOT/functions" && npm ci && npm run build)

echo "==> Deploy firestore:rules + functions → $PROJECT"
"$FIREBASE_BIN" deploy \
  --project "$PROJECT" \
  --only firestore:rules,functions:onSolveRequestCreated,functions:solveQuestion

echo ""
echo "✓ Deploy bitti. Telefonda:"
echo "  cd ~/Desktop/cozbil && git pull && bash scripts/phone-dev-build.sh metro"
echo "  Sonra bir soru fotoğrafı dene (Firestore solve path)."
