#!/usr/bin/env bash
# Sadece Firestore rules publish (solveRequests izni).
# Mac:
#   bash scripts/publish-firestore-rules.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
TOOLS="$ROOT/.tools"
export npm_config_cache="${TMPDIR:-/tmp}/cozbil-npm-cache-$$"
mkdir -p "$npm_config_cache"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$ROOT"

if command -v firebase >/dev/null 2>&1; then
  FB=(firebase)
elif [[ -x "$TOOLS/node_modules/.bin/firebase" ]]; then
  FB=("$TOOLS/node_modules/.bin/firebase")
else
  mkdir -p "$TOOLS"
  npm install --prefix "$TOOLS" firebase-tools@latest --no-fund --no-audit
  FB=("$TOOLS/node_modules/.bin/firebase")
fi

echo "==> Publishing firestore rules → $PROJECT"
echo "    file: firebase/firestore.rules"
"${FB[@]}" deploy --project "$PROJECT" --only firestore:rules --non-interactive

echo ""
echo "✓ Rules publish OK."
echo "  Şimdi (bir kez):"
echo "  ${FB[*]} deploy --project $PROJECT --only functions:onSolveRequestCreated"
echo "  Sonra Metro + telefonda tekrar dene."
