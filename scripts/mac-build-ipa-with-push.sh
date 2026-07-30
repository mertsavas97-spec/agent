#!/usr/bin/env bash
# Mac-only one-shot: IPA with inactive-push fix (PR #29).
# Usage on owner Mac:
#   export EXPO_PUBLIC_FIREBASE_API_KEY=...
#   export EXPO_PUBLIC_FIREBASE_APP_ID=...
#   bash scripts/mac-build-ipa-with-push.sh
#
# Or pull EAS env first:
#   cd apps/mobile && eas env:pull --environment production && cd ../..
#   bash scripts/mac-build-ipa-with-push.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="${IPA_PUSH_BRANCH:-cursor/inactive-push-weekly-2914}"
OUT="${IOS_IPA_OUT:-$HOME/Desktop/cozbil-production.ipa}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: Bu script yalnız macOS + Xcode ister. Bu host: $(uname -s)." >&2
  echo "Cloud Linux IPA üretemez. Mac Terminal'de çalıştırın." >&2
  exit 1
fi

cd "$ROOT"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH" || true

export IOS_IPA_OUT="$OUT"
bash "$ROOT/scripts/build-ios-ipa-local.sh"

echo ""
echo "✓ IPA: $OUT"
echo "Sonraki: Transporter veya: cd apps/mobile && eas submit -p ios --profile production --path \"$OUT\""
