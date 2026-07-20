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

if [[ ! -f "$MOBILE/.env" ]]; then
  fail "apps/mobile/.env yok" "cp apps/mobile/.env.example apps/mobile/.env ve Firebase key’leri doldur"
fi

if grep -qE 'EXPO_PUBLIC_FIREBASE_API_KEY=\s*$' "$MOBILE/.env" 2>/dev/null; then
  echo "UYARI: EXPO_PUBLIC_FIREBASE_API_KEY boş — solve/auth canlı çalışmayabilir."
fi

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
  echo "==> Metro (dev-client) — telefonda ÇözBil uygulamasını aç"
  echo "    Aynı Wi‑Fi’de değilsen: bash scripts/phone-dev-build.sh metro --tunnel"
  echo ""
  if [[ "$USE_TUNNEL" -eq 1 ]]; then
    exec npx expo start --dev-client --tunnel
  else
    exec npx expo start --dev-client
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
