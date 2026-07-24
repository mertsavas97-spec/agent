#!/usr/bin/env bash
# Mac-only: local EAS production IPA (no Expo cloud build minutes).
# Usage:
#   export EXPO_PUBLIC_FIREBASE_API_KEY=...
#   export EXPO_PUBLIC_FIREBASE_APP_ID=...
#   # or: eas env:pull --environment production
#   bash scripts/build-ios-ipa-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
OUT="${IOS_IPA_OUT:-$ROOT/cozbil-production.ipa}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "error: iOS IPA local build requires macOS + Xcode (this host is $(uname -s))." >&2
  echo "Use GitHub Actions workflow 'iOS production IPA' (macos-14) instead." >&2
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "error: xcodebuild not found — install Xcode." >&2
  exit 1
fi

if [[ -z "${EXPO_PUBLIC_FIREBASE_API_KEY:-}" || -z "${EXPO_PUBLIC_FIREBASE_APP_ID:-}" ]]; then
  echo "error: set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_APP_ID (or eas env:pull)." >&2
  exit 1
fi

export EAS_BUILD_PROFILE=production
export EAS_LOCAL_BUILD_WORKINGDIR="${EAS_LOCAL_BUILD_WORKINGDIR:-$HOME/eas-local-build}"
mkdir -p "$EAS_LOCAL_BUILD_WORKINGDIR"

cd "$MOBILE"
npm ci
npx eas-cli build \
  --platform ios \
  --profile production \
  --local \
  --non-interactive \
  --output "$OUT"

echo "IPA ready: $OUT"
