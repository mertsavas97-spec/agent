#!/usr/bin/env bash
# ÇözBil — Mac masaüstü lokal kurulum (iOS Simulator)
# Kullanım:
#   cd ~/Desktop/cozbil && bash scripts/setup-desktop-macos.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
FUNCS="$ROOT/functions"

echo "==> Repo: $ROOT"

# Homebrew node@22 PATH (Apple Silicon / Intel)
export PATH="/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

fail() {
  echo ""
  echo "HATA: $1"
  echo "$2"
  exit 1
}

if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "→ Node yok; Homebrew ile node@22 kuruluyor..."
    brew install node@22
    brew link node@22 --force --overwrite || true
    export PATH="/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:$PATH"
  else
    fail "Node yok" "https://nodejs.org (LTS 22) veya: brew install node@22"
  fi
fi

if ! command -v npm >/dev/null 2>&1; then
  fail "npm yok" "Node kurulumunu kontrol et."
fi

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  fail "Node >= 20 gerekli (şimdi: $(node -v))" "brew install node@22"
fi
echo "✓ Node $(node -v) / npm $(npm -v)"

if ! command -v xcodebuild >/dev/null 2>&1; then
  fail "Xcode yok" "App Store → Xcode kur, bir kez aç, sonra: xcode-select --install"
fi
echo "✓ Xcode $(xcodebuild -version 2>/dev/null | head -1)"

if ! command -v pod >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "→ CocoaPods yok; brew install cocoapods..."
    brew install cocoapods
  else
    fail "CocoaPods (pod) yok" "brew install cocoapods  veya  sudo gem install cocoapods"
  fi
fi
echo "✓ CocoaPods $(pod --version 2>/dev/null || echo ok)"

echo "==> npm install (mobile)"
(cd "$MOBILE" && npm install)

echo "==> npm install (functions)"
(cd "$FUNCS" && npm install)

if [[ ! -f "$MOBILE/.env" ]]; then
  cp "$MOBILE/.env.example" "$MOBILE/.env"
  echo ""
  echo "!! apps/mobile/.env oluşturuldu (.env.example'dan)."
  echo "!! Firebase Console → cozbil-dev-f9583 → Project settings → Web app"
  echo "!! API_KEY + APP_ID doldur (diğer alanlar şablonda hazır)."
  echo "!! Sonra tekrar: bash scripts/setup-desktop-macos.sh"
  echo ""
  exit 2
fi

# Boş kritik alan uyarısı (kurulumu durdurmaz)
if grep -qE 'EXPO_PUBLIC_FIREBASE_API_KEY=\s*$' "$MOBILE/.env" 2>/dev/null; then
  echo ""
  echo "UYARI: EXPO_PUBLIC_FIREBASE_API_KEY boş — canlı Firebase çalışmaz."
  echo "       UI-only için EXPO_PUBLIC_SCREENSHOT_MODE=1 yapabilirsin."
  echo ""
fi

echo "==> Typecheck / test (mobile)"
(cd "$MOBILE" && npm run typecheck && npm test -- --passWithNoTests)

echo ""
echo "Kurulum tamam."
echo ""
echo "iOS Simulator demo:"
echo "  cd $MOBILE"
echo "  npx expo prebuild --platform ios"
echo "  npx expo run:ios"
echo ""
echo "Sadece Metro (önceden build varsa):"
echo "  npx expo start --ios"
echo ""
echo "Rehber: docs/setup/DESKTOP_LOCAL_SETUP.md"
echo ""
