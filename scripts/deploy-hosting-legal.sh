#!/usr/bin/env bash
# Deploy Firebase Hosting legal pages (privacy + terms).
# Requires: firebase login (owner).
#
#   bash scripts/deploy-hosting-legal.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
TOOLS="$ROOT/.tools"
export npm_config_cache="${TMPDIR:-/tmp}/cozbil-npm-cache-$$"
mkdir -p "$npm_config_cache"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$ROOT"

for path in hosting/public/privacy/index.html hosting/public/terms/index.html; do
  if [[ ! -f "$path" ]]; then
    echo "Missing $path" >&2
    exit 1
  fi
done

if ! grep -q '"/terms"' firebase.json; then
  echo "firebase.json missing /terms rewrite" >&2
  exit 1
fi

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

if ! "$FIREBASE_BIN" projects:list --project "$PROJECT" >/dev/null 2>&1; then
  echo "Firebase login gerekli:"
  echo "  $FIREBASE_BIN login --reauth"
  exit 1
fi

echo "==> Deploy hosting"
"$FIREBASE_BIN" deploy --project "$PROJECT" --only hosting

BASE="https://${PROJECT}.web.app"
echo ""
echo "✓ Hosting deploy bitti. Smoke:"
echo "  curl -sI ${BASE}/privacy | head -5"
echo "  curl -sI ${BASE}/terms | head -5"
echo ""
echo "Counsel imzası ayrıca gerekir — deploy ≠ hukuki onay."
