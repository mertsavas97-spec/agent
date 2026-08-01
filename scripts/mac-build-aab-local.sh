#!/usr/bin/env bash
# Mac: production Android AAB (Play kapalı test / internal).
# iOS polish ile aynı dal — version 1.0.2 / versionCode 18.
#
#   cd ~/agent
#   git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull
#   bash scripts/mac-build-aab-local.sh
#
# .env.local gitignore — Firebase key chat'e yapıştırma.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ANDROID_AAB_OUT:-$HOME/Desktop/cozbil-production.aab}"
ENV_FILE="$ROOT/apps/mobile/.env.local"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: Yalnız macOS. Bu host: $(uname -s)." >&2
  exit 1
fi

cd "$ROOT"
git fetch origin >/dev/null 2>&1 || true
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)"
if [[ -n "${AAB_PUSH_BRANCH:-}" ]]; then
  echo "==> branch (AAB_PUSH_BRANCH): $AAB_PUSH_BRANCH"
  git checkout "$AAB_PUSH_BRANCH"
  git pull --ff-only origin "$AAB_PUSH_BRANCH" || true
else
  echo "==> branch (current): $CURRENT_BRANCH"
  git pull --ff-only origin "$CURRENT_BRANCH" 2>/dev/null || git pull --ff-only || true
fi
echo "==> tip: $(git rev-parse --short HEAD)"

if [[ -f "$ENV_FILE" ]]; then
  echo "==> loading $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# Ads: stub/test off for Play closed-test build
export EXPO_PUBLIC_ADS_STUB="${EXPO_PUBLIC_ADS_STUB:-0}"
export EXPO_PUBLIC_ADS_USE_TEST_UNITS="${EXPO_PUBLIC_ADS_USE_TEST_UNITS:-0}"

# Firebase public defaults (non-secret)
export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-cozbil-dev-f9583.firebaseapp.com}"
export EXPO_PUBLIC_FIREBASE_PROJECT_ID="${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-cozbil-dev-f9583}"
export EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:-cozbil-dev-f9583.firebasestorage.app}"
export EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-717206185063}"
export EXPO_PUBLIC_FIREBASE_APP_ID="${EXPO_PUBLIC_FIREBASE_APP_ID:-1:717206185063:web:74256b15d50acb5c49a0c2}"

if [[ -z "${EXPO_PUBLIC_FIREBASE_API_KEY:-}" ]]; then
  echo "error: EXPO_PUBLIC_FIREBASE_API_KEY yok." >&2
  echo "apps/mobile/.env.local içine ekle (gitignore)." >&2
  exit 1
fi

echo "==> Firebase project: ${EXPO_PUBLIC_FIREBASE_PROJECT_ID}"
echo "==> AAB out: $OUT"

export ANDROID_AAB_OUT="$OUT"
bash "$ROOT/scripts/build-android-aab-local.sh"

echo ""
echo "✓ AAB: $OUT"
echo ""
echo "Play Console:"
echo "  Test etme ve yayınlama → Kapalı test → alpha → Yeni sürüm oluştur"
echo "  Bu AAB'yi yükle → İncele → Yayınla (kapalı test)"
echo "  14 günlük sayaç sıfırlanmaz (test kullanıcıları kayıtlı kalsın)"
