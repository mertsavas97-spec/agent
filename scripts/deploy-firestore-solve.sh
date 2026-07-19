#!/usr/bin/env bash
# Deploy Firestore rules + Functions (includes onSolveRequestCreated).
# Mac / owner:
#   gcloud auth login   # or firebase login
#   bash scripts/deploy-firestore-solve.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$ROOT"

if ! command -v firebase >/dev/null 2>&1; then
  echo "→ firebase-tools kuruluyor (npx)"
  FIREBASE=(npx --yes firebase-tools@latest)
else
  FIREBASE=(firebase)
fi

echo "==> Build functions"
(cd "$ROOT/functions" && npm ci && npm run build)

echo "==> Deploy firestore:rules + functions → $PROJECT"
"${FIREBASE[@]}" deploy \
  --project "$PROJECT" \
  --only firestore:rules,functions:onSolveRequestCreated,functions:solveQuestion

echo ""
echo "✓ Deploy bitti. Telefonda:"
echo "  cd ~/Desktop/cozbil && git pull && bash scripts/phone-dev-build.sh metro"
echo "  Sonra bir soru fotoğrafı dene (Firestore solve path)."
