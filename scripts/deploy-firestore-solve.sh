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

# Auth / project access check — do not swallow stderr (old check hid real errors
# and falsely said "login required" when the user was already logged in).
echo "==> Firebase oturum / proje kontrolü"
if ! LIST_OUT="$("$FIREBASE_BIN" projects:list 2>&1)"; then
  echo "$LIST_OUT" >&2
  echo "" >&2
  echo "Firebase CLI proje listesi alamadı. Dene:" >&2
  echo "  $FIREBASE_BIN login --reauth" >&2
  echo "  # veya: npx firebase-tools@latest login --reauth" >&2
  exit 1
fi
if ! printf '%s\n' "$LIST_OUT" | grep -q "$PROJECT"; then
  echo "$LIST_OUT" >&2
  echo "" >&2
  echo "error: Hesapta proje yok: $PROJECT" >&2
  echo "  firebase login --reauth   # hello@summify.app" >&2
  exit 1
fi
echo "✓ oturum OK — $PROJECT listede"

echo "==> Build functions"
(cd "$ROOT/functions" && npm ci && npm run build)

echo "==> 1/2 Deploy firestore:rules"
"$FIREBASE_BIN" deploy --project "$PROJECT" --only firestore:rules

echo "==> 2/2 Deploy Storage+Firestore solve triggers (+ solveQuestion)"
"$FIREBASE_BIN" deploy \
  --project "$PROJECT" \
  --only functions:onSolveUploadFinalized,functions:onSolveRequestCreatedV2,functions:solveQuestion

echo ""
echo "✓ Deploy bitti."
echo "  Birincil: onSolveUploadFinalized (Storage)"
echo "  Yedek:    onSolveRequestCreatedV2 (Firestore)"
echo "  Telefonda TestFlight’ta tekrar fotoğraf dene (yeni IPA gerekmez)."
