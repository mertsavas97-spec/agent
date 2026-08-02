#!/usr/bin/env bash
# ÇözBil — kişisel telefona LOKAL native development build (Expo Go değil)
#
# Kullanım (Mac, telefon USB ile bağlı):
#   cd ~/Desktop/cozbil
#   bash scripts/phone-dev-build.sh android   # Android USB + USB debugging
#   bash scripts/phone-dev-build.sh ios       # iPhone USB + Developer Mode
#   bash scripts/phone-dev-build.sh metro     # Sonraki günler: sadece JS sunucu
#   bash scripts/phone-dev-build.sh metro --tunnel  # Aynı Wi‑Fi yoksa
#
# Akış:
#   1) Bu script bir kez native app’i telefona kurar (expo-dev-client).
#   2) Sonraki JS/UI değişiklikleri için sadece `metro` çalıştır — yeniden APK/IPA yok.
#   3) Native paket (kamera lib vb.) eklenince tekrar android|ios çalıştır.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
TARGET="${1:-}"
SHIFT_ARGS=("${@:2}")

export PATH="/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

fail() {
  echo ""
  echo "HATA: $1"
  echo "$2"
  exit 1
}

usage() {
  cat <<'EOF'
Kullanım:
  bash scripts/phone-dev-build.sh android [--tunnel]
  bash scripts/phone-dev-build.sh ios [--tunnel]
  bash scripts/phone-dev-build.sh metro [--tunnel]

Öneri: İlk kurulum android|ios, günlük kontrol metro.
EOF
  exit 1
}

[[ -n "$TARGET" ]] || usage

command -v node >/dev/null || fail "Node yok" "brew install node@22"
command -v npm >/dev/null || fail "npm yok" "Node kurulumunu kontrol et"

# Prefer .env.local (gitignore) then .env — same pattern as mac-build-ipa-with-push.sh
ENV_LOCAL="$MOBILE/.env.local"
ENV_FILE="$MOBILE/.env"
if [[ -f "$ENV_LOCAL" ]]; then
  echo "==> loading $ENV_LOCAL"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  set +a
elif [[ -f "$ENV_FILE" ]]; then
  echo "==> loading $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  fail "Firebase env yok" "apps/mobile/.env.local veya .env oluştur — docs/qa/PHONE_DEMO_INSTALL.md"
fi

if [[ -z "${EXPO_PUBLIC_FIREBASE_API_KEY:-}" ]]; then
  echo "UYARI: EXPO_PUBLIC_FIREBASE_API_KEY boş — solve/auth canlı çalışmayabilir."
fi

# Demo defaults: live Firebase + live AdMob iOS units (override via env)
export EXPO_PUBLIC_USE_EMULATORS="${EXPO_PUBLIC_USE_EMULATORS:-0}"
export EXPO_PUBLIC_SCREENSHOT_MODE="${EXPO_PUBLIC_SCREENSHOT_MODE:-0}"
export EXPO_PUBLIC_ADS_STUB="${EXPO_PUBLIC_ADS_STUB:-0}"
export EXPO_PUBLIC_ADS_USE_TEST_UNITS="${EXPO_PUBLIC_ADS_USE_TEST_UNITS:-0}"
export EXPO_PUBLIC_ADMOB_IOS_APP_ID="${EXPO_PUBLIC_ADMOB_IOS_APP_ID:-ca-app-pub-4628962707131944~6347757786}"
export EXPO_PUBLIC_ADMOB_BANNER_IOS="${EXPO_PUBLIC_ADMOB_BANNER_IOS:-ca-app-pub-4628962707131944/1521648962}"
export EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS="${EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS:-ca-app-pub-4628962707131944/3447425993}"
export EXPO_PUBLIC_ADMOB_REWARDED_IOS="${EXPO_PUBLIC_ADMOB_REWARDED_IOS:-ca-app-pub-4628962707131944/8645460517}"

cd "$MOBILE"

if [[ ! -d node_modules/expo-dev-client ]]; then
  echo "==> expo-dev-client kuruluyor"
  npx expo install expo-dev-client
fi

USE_TUNNEL=0
if [[ ${#SHIFT_ARGS[@]} -gt 0 ]]; then
  for a in "${SHIFT_ARGS[@]}"; do
    [[ "$a" == "--tunnel" ]] && USE_TUNNEL=1
  done
fi

start_metro() {
  echo ""
  # Wrong branch / stale cache = old YGS labels, no exam-ad confirm, old icons.
  local branch sha
  branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  sha="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo '?')"
  echo "==> Git: $branch @ $sha"
  if [[ "$branch" != "cursor/home-polish-yks-ads-ocr-2914" ]]; then
    echo "UYARI: Bu branch’de YKS/ads/icon polish yok olabilir." >&2
    echo "       git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull" >&2
  fi
  if [[ -z "${EXPO_PUBLIC_SOLVE_PROXY_URL:-}" || -z "${EXPO_PUBLIC_SOLVE_PROXY_TOKEN:-}" ]]; then
    # Try load from files so the warning is accurate
    if [[ -f "$ENV_LOCAL" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "$ENV_LOCAL"
      set +a
    fi
  fi
  if [[ -n "${EXPO_PUBLIC_SOLVE_PROXY_URL:-}" && -n "${EXPO_PUBLIC_SOLVE_PROXY_TOKEN:-}" ]]; then
    echo "==> Metro — solve proxy: ${EXPO_PUBLIC_SOLVE_PROXY_URL}"
  else
    echo "==> Metro — UYARI: SOLVE_PROXY yok → logda 'proxy off' görürsün"
    echo "    Düzelt: bash scripts/phone-demo-proxy-mac.sh && bu komutu tekrar çalıştır"
  fi
  echo "==> Metro (dev-client, --clear) — telefonda uygulamayı kapat/aç"
  echo "    Aynı Wi‑Fi’de değilsen: bash scripts/phone-dev-build.sh metro --tunnel"
  echo "    Ana ekran ikonu için ayrıca: bash scripts/phone-demo-mac.sh ios"
  echo ""
  # Always clear transform cache — dogfood often sticks on an old bundle.
  if [[ "$USE_TUNNEL" -eq 1 ]]; then
    exec npx expo start --dev-client --clear --tunnel
  else
    exec npx expo start --dev-client --clear
  fi
}

case "$TARGET" in
  metro|start)
    start_metro
    ;;

  android)
    command -v adb >/dev/null || fail "adb yok" "Android Studio kur → SDK Platform-Tools. PATH’e ekle."
    echo "==> Bağlı Android cihazlar:"
    adb devices -l
    if ! adb devices | awk 'NR>1 && $2=="device" {found=1} END{exit !found}'; then
      fail "USB’de hazır Android yok" "USB debugging aç, kablo tak, ‘Bu bilgisayara güven’ de, tekrar dene."
    fi
    echo "==> prebuild + run:android --device (ilk sefer uzun sürebilir)"
    npx expo prebuild --platform android
    npx expo run:android --device
    echo ""
    echo "✓ Native build telefonda. Sonraki güncellemeler için:"
    echo "  bash scripts/phone-dev-build.sh metro"
    ;;

  ios)
    command -v xcodebuild >/dev/null || fail "Xcode yok" "App Store → Xcode"
    echo "==> prebuild + run:ios --device"
    echo "    iPhone: Developer Mode + Trust This Computer"
    echo "    Xcode ilk seferde Apple ID ile signing isteyebilir (Team seç)."
    npx expo prebuild --platform ios
    npx expo run:ios --device
    echo ""
    echo "✓ Native build telefonda. Sonraki güncellemeler için:"
    echo "  bash scripts/phone-dev-build.sh metro"
    ;;

  *)
    usage
    ;;
esac
