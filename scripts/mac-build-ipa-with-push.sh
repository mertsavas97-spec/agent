#!/usr/bin/env bash
# Mac-only: production IPA (push fix + live AdMob + Firebase from local env).
#
# Bir kez (key'i chat'e yapistirmayin):
#   cd ~/agent
#   git checkout cursor/scrub-google-api-key-pr31-4710 && git pull
#   cat > apps/mobile/.env.local <<'EOF'
#   EXPO_PUBLIC_FIREBASE_API_KEY=AIza...   # gcloud get-key-string ciktiniz
#   EXPO_PUBLIC_FIREBASE_APP_ID=1:717206185063:web:74256b15d50acb5c49a0c2
#   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cozbil-dev-f9583.firebaseapp.com
#   EXPO_PUBLIC_FIREBASE_PROJECT_ID=cozbil-dev-f9583
#   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cozbil-dev-f9583.firebasestorage.app
#   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=717206185063
#   EOF
#
# Sonra her IPA:
#   bash scripts/mac-build-ipa-with-push.sh
#
# .env.local gitignore'da — commit edilmez. Cursor/EAS sart degil.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="${IPA_PUSH_BRANCH:-cursor/scrub-google-api-key-pr31-4710}"
OUT="${IOS_IPA_OUT:-$HOME/Desktop/cozbil-production.ipa}"
ENV_FILE="$ROOT/apps/mobile/.env.local"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: Yalniz macOS + Xcode. Bu host: $(uname -s)." >&2
  exit 1
fi

cd "$ROOT"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH" || true

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
