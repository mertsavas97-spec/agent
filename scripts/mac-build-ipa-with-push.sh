#!/usr/bin/env bash
# Mac-only: production IPA (push fix + live AdMob + Firebase from local env).
#
# Branch: varsayılan = şu anki checkout (eski scrub dalına zorla geçmez).
#   IPA_PUSH_BRANCH=cursor/home-polish-yks-ads-ocr-2914 bash scripts/mac-build-ipa-with-push.sh
#
# Bir kez (key'i chat'e yapistirmayin):
#   cd ~/agent
#   git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull
#   # apps/mobile/.env.local içinde Firebase public keys (gitignore)
#
# Sonra her IPA:
#   bash scripts/mac-build-ipa-with-push.sh
#
# .env.local gitignore'da — commit edilmez. Cursor/EAS sart degil.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${IOS_IPA_OUT:-$HOME/Desktop/cozbil-production.ipa}"
ENV_FILE="$ROOT/apps/mobile/.env.local"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: Yalniz macOS + Xcode. Bu host: $(uname -s)." >&2
  exit 1
fi

cd "$ROOT"
git fetch origin >/dev/null 2>&1 || true
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)"
if [[ -n "${IPA_PUSH_BRANCH:-}" ]]; then
  BRANCH="$IPA_PUSH_BRANCH"
  echo "==> branch (IPA_PUSH_BRANCH): $BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH" || true
else
  BRANCH="$CURRENT_BRANCH"
  echo "==> branch (current): $BRANCH"
  git pull --ff-only origin "$BRANCH" 2>/dev/null || git pull --ff-only || true
fi
echo "==> tip: $(git rev-parse --short HEAD) — app.json buildNumber kontrol et (beklenen: 18)"

# Load local secrets (never committed)
if [[ -f "$ENV_FILE" ]]; then
  echo "==> loading $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# AdMob — eas.json production ile ayni (override edilebilir)
export EXPO_PUBLIC_ADS_STUB="${EXPO_PUBLIC_ADS_STUB:-0}"
export EXPO_PUBLIC_ADS_USE_TEST_UNITS="${EXPO_PUBLIC_ADS_USE_TEST_UNITS:-0}"
export EXPO_PUBLIC_ADMOB_IOS_APP_ID="${EXPO_PUBLIC_ADMOB_IOS_APP_ID:-ca-app-pub-4628962707131944~6347757786}"
export EXPO_PUBLIC_ADMOB_BANNER_IOS="${EXPO_PUBLIC_ADMOB_BANNER_IOS:-ca-app-pub-4628962707131944/1521648962}"
export EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS="${EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS:-ca-app-pub-4628962707131944/3447425993}"
export EXPO_PUBLIC_ADMOB_REWARDED_IOS="${EXPO_PUBLIC_ADMOB_REWARDED_IOS:-ca-app-pub-4628962707131944/8645460517}"

# Firebase public config defaults (non-secret ids)
export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-cozbil-dev-f9583.firebaseapp.com}"
export EXPO_PUBLIC_FIREBASE_PROJECT_ID="${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-cozbil-dev-f9583}"
export EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:-cozbil-dev-f9583.firebasestorage.app}"
export EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-717206185063}"
export EXPO_PUBLIC_FIREBASE_APP_ID="${EXPO_PUBLIC_FIREBASE_APP_ID:-1:717206185063:web:74256b15d50acb5c49a0c2}"

if [[ -z "${EXPO_PUBLIC_FIREBASE_API_KEY:-}" ]]; then
  echo "error: EXPO_PUBLIC_FIREBASE_API_KEY yok." >&2
  echo "apps/mobile/.env.local olusturun (gitignore) veya export edin. Cursor/EAS gerekmez." >&2
  exit 1
fi
if [[ "${EXPO_PUBLIC_ADMOB_IOS_APP_ID}" != *~* ]]; then
  echo "error: AdMob App ID '~' icermeli." >&2
  exit 1
fi

echo "==> AdMob App ID: ${EXPO_PUBLIC_ADMOB_IOS_APP_ID}"
echo "==> AdMob units: banner/interstitial/rewarded (iOS)"
echo "==> Firebase project: ${EXPO_PUBLIC_FIREBASE_PROJECT_ID}"
echo "==> IPA out: $OUT"

export IOS_IPA_OUT="$OUT"
bash "$ROOT/scripts/build-ios-ipa-local.sh"

echo ""
echo "✓ IPA: $OUT"
