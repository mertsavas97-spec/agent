#!/usr/bin/env bash
# Mac-only: local EAS production Android App Bundle (AAB) for Play Console.
#
# Usage:
#   export EXPO_PUBLIC_FIREBASE_API_KEY=...
#   export EXPO_PUBLIC_FIREBASE_APP_ID=...
#   bash scripts/build-android-aab-local.sh
#
# Prefer: bash scripts/mac-build-aab-local.sh  (loads .env.local + AdMob + disk checks)
#
# Disk: local Gradle derlemesi ~15–25 GB geçici alan ister.
# Az yer varsa: GitHub Actions → "Android production AAB" (workflow_dispatch).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
OUT="${ANDROID_AAB_OUT:-$HOME/Desktop/cozbil-production.aab}"
MIN_FREE_GB="${AAB_MIN_FREE_GB:-12}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: Local Android AAB script is for macOS (this host: $(uname -s))." >&2
  echo "Alternative: GitHub → Actions → Android production AAB → Run workflow" >&2
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

# --- disk gate ---
# APFS often shows low "Avail" on the sealed volume; use Data volume when present.
DISK_PATH="/"
if [[ -d "/System/Volumes/Data" ]]; then
  DISK_PATH="/System/Volumes/Data"
fi
FREE_KB="$(df -k "$DISK_PATH" | awk 'NR==2 {print $4}')"
FREE_GB=$((FREE_KB / 1024 / 1024))
echo "==> free disk (${DISK_PATH}): ~${FREE_GB} GiB (min ${MIN_FREE_GB})"
if (( FREE_GB < MIN_FREE_GB )); then
  echo "" >&2
  echo "error: Disk dolu (~${FREE_GB} GiB boş). Yerel AAB için en az ~${MIN_FREE_GB} GiB lazım." >&2
  echo "" >&2
  echo "Hızlı temizlik (Mac Terminal):" >&2
  echo "  rm -rf ~/eas-local-build" >&2
  echo "  rm -rf ~/Library/Developer/Xcode/DerivedData" >&2
  echo "  rm -rf ~/.gradle/caches" >&2
  echo "  rm -rf ~/Library/Caches/com.apple.dt.Xcode" >&2
  echo "  # Eski IPA/AAB: ~/Desktop/*.ipa ~/Desktop/*.aab" >&2
  echo "  df -h /System/Volumes/Data" >&2
  echo "" >&2
  echo "Disk açmadan AAB almak için (önerilen):" >&2
  echo "  GitHub → Actions → \"Android production AAB\" → Run workflow" >&2
  echo "  (dal: cursor/home-polish-yks-ads-ocr-2914)" >&2
  exit 1
fi

export EAS_BUILD_PROFILE=production
export EAS_LOCAL_BUILD_WORKINGDIR="${EAS_LOCAL_BUILD_WORKINGDIR:-$HOME/eas-local-build}"

# Önceki yarım build artıklarını sil (disk + bozuk CMake cache)
if [[ "${AAB_SKIP_CLEAN:-0}" != "1" ]]; then
  echo "==> cleaning previous local build dir: $EAS_LOCAL_BUILD_WORKINGDIR"
  rm -rf "$EAS_LOCAL_BUILD_WORKINGDIR"
fi
mkdir -p "$EAS_LOCAL_BUILD_WORKINGDIR"

# Sadece arm64 derle → disk/RAM ~4x daha az (telefonların çoğu 64-bit)
# Override: AAB_ABIS=armeabi-v7a,arm64-v8a
export ORG_GRADLE_PROJECT_reactNativeArchitectures="${AAB_ABIS:-arm64-v8a}"
echo "==> native ABIs: $ORG_GRADLE_PROJECT_reactNativeArchitectures"

# Gradle OOM / Metaspace (logda görüldü) — makul üst sınır
export GRADLE_OPTS="${GRADLE_OPTS:--Dorg.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8}"

echo "==> version: $(node -p "require('$MOBILE/app.json').expo.version") / versionCode $(node -p "require('$MOBILE/app.json').expo.android.versionCode")"
echo "==> AAB out: $OUT"
echo "==> AdMob Android: ${EXPO_PUBLIC_ADMOB_ANDROID_APP_ID:-"(default from code/eas.json)"}"

cd "$MOBILE"
# Fresh native project so config plugins re-apply.
rm -rf android
npm ci
# Bypass intermittent Gradle Plugin Portal resolve of foojay-resolver-convention.
node scripts/patch-rn-gradle-foojay.js
npx eas-cli build \
  --platform android \
  --profile production \
  --local \
  --non-interactive \
  --output "$OUT"

echo ""
echo "✓ AAB ready: $OUT"
echo "  Play Console → Kapalı test (alpha) → Yeni sürüm → bu AAB'yi yükle"
echo "  versionName 1.0.2 — versionCode Play'deki sayıdan büyük olmalı"
