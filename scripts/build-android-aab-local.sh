#!/usr/bin/env bash
# Mac-only: local EAS production Android App Bundle (AAB) for Play Console.
#
# Usage:
#   export EXPO_PUBLIC_FIREBASE_API_KEY=...
#   export EXPO_PUBLIC_FIREBASE_APP_ID=...
#   # optional Android AdMob (yoksa reklam Android'de kapalı kalır):
#   export EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-…~…
#   export EXPO_PUBLIC_ADMOB_BANNER_ANDROID=…
#   export EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID=…
#   export EXPO_PUBLIC_ADMOB_REWARDED_ANDROID=…
#   bash scripts/build-android-aab-local.sh
#
# Prefer: bash scripts/mac-build-aab-local.sh  (loads .env.local)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
OUT="${ANDROID_AAB_OUT:-$HOME/Desktop/cozbil-production.aab}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: Local Android AAB script is for macOS (this host: $(uname -s))." >&2
  echo "Alternative: GitHub Actions → Android production AAB" >&2
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "error: Java yok. Kur: brew install --cask temurin@17" >&2
  exit 1
fi

if [[ -z "${EXPO_PUBLIC_FIREBASE_API_KEY:-}" || -z "${EXPO_PUBLIC_FIREBASE_APP_ID:-}" ]]; then
  echo "error: EXPO_PUBLIC_FIREBASE_API_KEY ve EXPO_PUBLIC_FIREBASE_APP_ID gerekli." >&2
  echo "apps/mobile/.env.local veya: bash scripts/mac-build-aab-local.sh" >&2
  exit 1
fi

export EAS_BUILD_PROFILE=production
export EAS_LOCAL_BUILD_WORKINGDIR="${EAS_LOCAL_BUILD_WORKINGDIR:-$HOME/eas-local-build}"
mkdir -p "$EAS_LOCAL_BUILD_WORKINGDIR"

echo "==> version: $(node -p "require('$MOBILE/app.json').expo.version") / versionCode $(node -p "require('$MOBILE/app.json').expo.android.versionCode")"
echo "==> AAB out: $OUT"

if [[ -z "${EXPO_PUBLIC_ADMOB_ANDROID_APP_ID:-}" || -z "${EXPO_PUBLIC_ADMOB_BANNER_ANDROID:-}" ]]; then
  echo ""
  echo "UYARI: Android AdMob birimleri yok — AAB alınır ama Android'de banner/ödüllü reklam görünmez."
  echo "  AdMob'da Android uygulama + Banner/Geçiş/Ödüllü oluştur → .env.local'e yaz."
  echo "  (iOS birimleri Android'de kullanılmaz.)"
  echo ""
fi

cd "$MOBILE"
# Fresh native project so config plugins re-apply.
rm -rf android
npm ci
npx eas-cli build \
  --platform android \
  --profile production \
  --local \
  --non-interactive \
  --output "$OUT"

echo ""
echo "✓ AAB ready: $OUT"
echo "  Play Console → Kapalı test (alpha) → Yeni sürüm → bu AAB'yi yükle"
echo "  versionName 1.0.2 / versionCode 18 (Play'deki 5'ten büyük)"
