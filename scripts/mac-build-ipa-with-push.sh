#!/usr/bin/env bash
# Mac-only one-shot: IPA with inactive-push + live iOS AdMob units.
# Usage:
#   export EXPO_PUBLIC_FIREBASE_API_KEY=...
#   export EXPO_PUBLIC_FIREBASE_APP_ID=...
#   export EXPO_PUBLIC_ADMOB_IOS_APP_ID='ca-app-pub-4628962707131944~6347757786'
#   bash scripts/mac-build-ipa-with-push.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="${IPA_PUSH_BRANCH:-cursor/admob-ios-units-2914}"
OUT="${IOS_IPA_OUT:-$HOME/Desktop/cozbil-production.ipa}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: Bu script yalnız macOS + Xcode ister. Bu host: $(uname -s)." >&2
  echo "Cloud Linux IPA üretemez. Mac Terminal'de çalıştırın." >&2
  exit 1
fi

# Live iOS units + App ID (AdMob console) — also in eas.json production.env
export EXPO_PUBLIC_ADS_STUB="${EXPO_PUBLIC_ADS_STUB:-0}"
export EXPO_PUBLIC_ADS_USE_TEST_UNITS="${EXPO_PUBLIC_ADS_USE_TEST_UNITS:-0}"
export EXPO_PUBLIC_ADMOB_IOS_APP_ID="${EXPO_PUBLIC_ADMOB_IOS_APP_ID:-ca-app-pub-4628962707131944~6347757786}"
export EXPO_PUBLIC_ADMOB_BANNER_IOS="${EXPO_PUBLIC_ADMOB_BANNER_IOS:-ca-app-pub-4628962707131944/1521648962}"
export EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS="${EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS:-ca-app-pub-4628962707131944/3447425993}"
export EXPO_PUBLIC_ADMOB_REWARDED_IOS="${EXPO_PUBLIC_ADMOB_REWARDED_IOS:-ca-app-pub-4628962707131944/8645460517}"

if [[ -z "${EXPO_PUBLIC_ADMOB_IOS_APP_ID:-}" || "${EXPO_PUBLIC_ADMOB_IOS_APP_ID}" == *3940256099942544* ]]; then
  echo "error: EXPO_PUBLIC_ADMOB_IOS_APP_ID gerekli (AdMob → Uygulama ayarları → Uygulama kimliği, …~…)." >&2
  echo "Örnek: export EXPO_PUBLIC_ADMOB_IOS_APP_ID='ca-app-pub-4628962707131944~6347757786'" >&2
  exit 1
fi
if [[ "${EXPO_PUBLIC_ADMOB_IOS_APP_ID}" != *~* ]]; then
  echo "error: App ID '~' içermeli (birim id '/' ile karıştırmayın)." >&2
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
