#!/usr/bin/env bash
# Deploy Firestore rules + Functions (includes onSolveRequestCreated).
# Mac / owner:
#   sudo chown -R "$(whoami)" ~/.npm   # if npm EACCES
#   npx firebase-tools@latest login
#   bash scripts/deploy-firestore-solve.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
TOOLS="$ROOT/.tools"
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
  echo "→ firebase-tools yerel kuruluyor ($TOOLS)…" >&2
  mkdir -p "$TOOLS"
  npm install --prefix "$TOOLS" firebase-tools@latest --no-fund --no-audit
  echo "$TOOLS/node_modules/.bin/firebase"
}

FIREBASE_BIN="$(resolve_firebase)"
echo "==> firebase: $FIREBASE_BIN"
echo "==> project: $PROJECT"

# Login check
if ! "$FIREBASE_BIN" projects:list --project "$PROJECT" >/dev/null 2>&1; then
  echo "Firebase login gerekli:"
  echo "  $FIREBASE_BIN login"
  exit 1
fi

echo "==> Build functions"
(cd "$ROOT/functions" && npm ci && npm run build)

echo "==> 1/2 Deploy firestore:rules"
"$FIREBASE_BIN" deploy --project "$PROJECT" --only firestore:rules

echo "==> 2/2 Deploy onSolveRequestCreated (+ solveQuestion)"
"$FIREBASE_BIN" deploy \
  --project "$PROJECT" \
  --only functions:onSolveRequestCreatedV2,functions:solveQuestion

echo ""
echo "✓ Deploy bitti."
echo "  Telefonda: bash scripts/phone-dev-build.sh metro"
echo "  Sonra soru fotoğrafı dene."
