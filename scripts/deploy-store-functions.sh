#!/usr/bin/env bash
# Deploy store-critical callables: grantRewardedSolve, purgeAccount, syncSubscription.
# Requires: firebase login (owner). Does not invent Play billing secrets.
#
#   bash scripts/deploy-store-functions.sh
#
# Optional: also deploy solve triggers after store callables:
#   WITH_SOLVE=1 bash scripts/deploy-store-functions.sh

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

if ! "$FIREBASE_BIN" projects:list --project "$PROJECT" >/dev/null 2>&1; then
  echo "Firebase login gerekli:"
  echo "  $FIREBASE_BIN login --reauth"
  exit 1
fi

echo "==> Build functions"
(cd "$ROOT/functions" && npm ci && npm run build)

ONLY="functions:grantRewardedSolve,functions:purgeAccount,functions:syncSubscription"
if [[ "${WITH_SOLVE:-0}" == "1" ]]; then
  ONLY="${ONLY},functions:onSolveUploadFinalized,functions:onSolveRequestCreatedV2,functions:solveQuestion"
fi

echo "==> Deploy $ONLY"
"$FIREBASE_BIN" deploy --project "$PROJECT" --only "$ONLY"

echo ""
echo "✓ Store functions deploy bitti."
echo "  Reminder: Play IAP needs Functions secret GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"
echo "            + PLAY_PACKAGE_NAME=com.cozbil.app (set via firebase functions:secrets / params)"
echo "  Next: bash scripts/deploy-hosting-legal.sh"
