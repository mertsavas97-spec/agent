#!/usr/bin/env bash
# ÇözBil — şahsi telefona demo kurulum (Mac only)
#
# Cloud/Linux agent IPA üretemez ve telefona yükleyemez.
# Bu script Mac'te: env kontrol → (opsiyonel) Functions invoker → USB kurulum
# veya production IPA (TestFlight yolu).
#
# Kullanım:
#   cd ~/agent
#   git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull
#
#   # bir kez: apps/mobile/.env.local (gitignore — chat'e key yapıştırma)
#   # EXPO_PUBLIC_FIREBASE_API_KEY=…   # yeni key (cozbil-firebase-client-*)
#   # EXPO_PUBLIC_FIREBASE_APP_ID=1:717206185063:web:74256b15d50acb5c49a0c2
#
#   bash scripts/phone-demo-mac.sh ios          # iPhone USB (en hızlı demo)
#   bash scripts/phone-demo-mac.sh android      # Android USB
#   bash scripts/phone-demo-mac.sh ios --ipa    # production IPA → Desktop
#   bash scripts/phone-demo-mac.sh ios --fix-backend  # sadece invoker düzelt
#
# Branch: varsayılan = şu anki checkout (eski scrub dalına zorla geçmez).
# İstersen: PHONE_DEMO_BRANCH=cursor/... bash scripts/phone-demo-mac.sh ios
#
# Doküman: docs/qa/PHONE_DEMO_INSTALL.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
ENV_LOCAL="$MOBILE/.env.local"
ENV_FILE="$MOBILE/.env"
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
Kullanım (Mac):
  bash scripts/phone-demo-mac.sh ios [--fix-backend] [--tunnel]
  bash scripts/phone-demo-mac.sh android [--fix-backend] [--tunnel]
  bash scripts/phone-demo-mac.sh ios --ipa [--fix-backend]
  bash scripts/phone-demo-mac.sh fix-backend

Not: App Store build 17 eski (silinmiş) Firebase key ile kırık — demo için yeni build şart.
EOF
  exit 1
}

[[ -n "$TARGET" ]] || usage

if [[ "$(uname -s)" != "Darwin" ]]; then
  fail "Yalnız macOS" "Bu host: $(uname -s). Cloud agent telefona yükleyemez — Mac'te çalıştır."
fi

FIX_BACKEND=0
DO_IPA=0
PASSTHRU=()
for a in "${SHIFT_ARGS[@]+"${SHIFT_ARGS[@]}"}"; do
  case "$a" in
    --fix-backend) FIX_BACKEND=1 ;;
    --ipa) DO_IPA=1 ;;
    *) PASSTHRU+=("$a") ;;
  esac
done

cd "$ROOT"
# Stay on the branch the owner already checked out — do NOT force an old demo branch.
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo HEAD)"
if [[ -n "${PHONE_DEMO_BRANCH:-}" ]]; then
  BRANCH="$PHONE_DEMO_BRANCH"
  echo "==> branch (PHONE_DEMO_BRANCH): $BRANCH"
  git fetch origin >/dev/null 2>&1 || true
  git checkout "$BRANCH" 2>/dev/null || true
  git pull --ff-only origin "$BRANCH" 2>/dev/null || true
else
  BRANCH="$CURRENT_BRANCH"
  echo "==> branch (current): $BRANCH @ $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
  git fetch origin >/dev/null 2>&1 || true
  if [[ "$BRANCH" != "HEAD" ]]; then
    git pull --ff-only origin "$BRANCH" 2>/dev/null || true
  fi
fi
if [[ "$BRANCH" == "cursor/scrub-google-api-key-pr31-4710" ]]; then
  echo "UYARI: Eski scrub demo dalındasın — YKS/ads/icon polish bu dalda yok." >&2
  echo "       git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull" >&2
  echo "       sonra tekrar: bash scripts/phone-demo-mac.sh ios" >&2
fi

load_env() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  echo "==> loading $f"
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
  return 0
}

if ! load_env "$ENV_LOCAL"; then
  if [[ -x "$ROOT/scripts/write-mobile-env-local.sh" ]] || [[ -f "$ROOT/scripts/write-mobile-env-local.sh" ]]; then
    echo "==> .env.local yok — gcloud ile yazılıyor…"
    bash "$ROOT/scripts/write-mobile-env-local.sh"
    load_env "$ENV_LOCAL" || true
  fi
fi
if ! load_env "$ENV_LOCAL"; then
  if ! load_env "$ENV_FILE"; then
    fail "Firebase env yok" "bash scripts/write-mobile-env-local.sh  (veya docs/qa/PHONE_DEMO_INSTALL.md)"
  fi
fi

# Public Firebase defaults (non-secret)
export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-cozbil-dev-f9583.firebaseapp.com}"
export EXPO_PUBLIC_FIREBASE_PROJECT_ID="${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-cozbil-dev-f9583}"
export EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:-cozbil-dev-f9583.firebasestorage.app}"
export EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-717206185063}"
export EXPO_PUBLIC_FIREBASE_APP_ID="${EXPO_PUBLIC_FIREBASE_APP_ID:-1:717206185063:web:74256b15d50acb5c49a0c2}"

# Live AdMob (demo = mağaza davranışı)
export EXPO_PUBLIC_ADS_STUB="${EXPO_PUBLIC_ADS_STUB:-0}"
export EXPO_PUBLIC_ADS_USE_TEST_UNITS="${EXPO_PUBLIC_ADS_USE_TEST_UNITS:-0}"
export EXPO_PUBLIC_ADMOB_IOS_APP_ID="${EXPO_PUBLIC_ADMOB_IOS_APP_ID:-ca-app-pub-4628962707131944~6347757786}"
export EXPO_PUBLIC_ADMOB_BANNER_IOS="${EXPO_PUBLIC_ADMOB_BANNER_IOS:-ca-app-pub-4628962707131944/1521648962}"
export EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS="${EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS:-ca-app-pub-4628962707131944/3447425993}"
export EXPO_PUBLIC_ADMOB_REWARDED_IOS="${EXPO_PUBLIC_ADMOB_REWARDED_IOS:-ca-app-pub-4628962707131944/8645460517}"
export EXPO_PUBLIC_USE_EMULATORS="${EXPO_PUBLIC_USE_EMULATORS:-0}"
export EXPO_PUBLIC_SCREENSHOT_MODE="${EXPO_PUBLIC_SCREENSHOT_MODE:-0}"

if [[ -z "${EXPO_PUBLIC_FIREBASE_API_KEY:-}" ]]; then
  fail "EXPO_PUBLIC_FIREBASE_API_KEY boş" "Yeni key’i .env.local’e yaz (eski Browser key silindi — App Store 17 kırık)."
fi

# Mirror into .env for expo CLI tools that only read .env
if [[ ! -f "$ENV_FILE" ]] || ! grep -q 'EXPO_PUBLIC_FIREBASE_API_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "==> syncing .env from loaded env (local only, gitignored patterns apply)"
  cat >"$ENV_FILE" <<EOF
EXPO_PUBLIC_FIREBASE_API_KEY=${EXPO_PUBLIC_FIREBASE_API_KEY}
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}
EXPO_PUBLIC_FIREBASE_PROJECT_ID=${EXPO_PUBLIC_FIREBASE_PROJECT_ID}
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
EXPO_PUBLIC_FIREBASE_APP_ID=${EXPO_PUBLIC_FIREBASE_APP_ID}
EXPO_PUBLIC_USE_EMULATORS=${EXPO_PUBLIC_USE_EMULATORS}
EXPO_PUBLIC_SCREENSHOT_MODE=${EXPO_PUBLIC_SCREENSHOT_MODE}
EXPO_PUBLIC_ADS_STUB=${EXPO_PUBLIC_ADS_STUB}
EXPO_PUBLIC_ADS_USE_TEST_UNITS=${EXPO_PUBLIC_ADS_USE_TEST_UNITS}
EXPO_PUBLIC_ADMOB_IOS_APP_ID=${EXPO_PUBLIC_ADMOB_IOS_APP_ID}
EXPO_PUBLIC_ADMOB_BANNER_IOS=${EXPO_PUBLIC_ADMOB_BANNER_IOS}
EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS=${EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS}
EXPO_PUBLIC_ADMOB_REWARDED_IOS=${EXPO_PUBLIC_ADMOB_REWARDED_IOS}
EOF
fi

echo "==> Firebase project: ${EXPO_PUBLIC_FIREBASE_PROJECT_ID}"
echo "==> AdMob App ID: ${EXPO_PUBLIC_ADMOB_IOS_APP_ID}"

ping_backend() {
  local code
  code="$(curl -sS -o /tmp/cozbil-phone-demo-ping.json -w '%{http_code}' \
    'https://europe-west1-cozbil-dev-f9583.cloudfunctions.net/ping' || true)"
  echo "==> Functions ping: HTTP $code"
  if [[ "$code" != "200" ]]; then
    echo "    UYARI: solve/callable’lar telefon demosunda 401/403 verebilir."
    echo "    Düzelt: bash scripts/fix-functions-invoker.sh"
    return 1
  fi
  return 0
}

run_fix_backend() {
  echo "==> Functions invoker düzeltmesi"
  command -v gcloud >/dev/null || fail "gcloud yok" "brew install --cask google-cloud-sdk && gcloud auth login"
  bash "$ROOT/scripts/fix-functions-invoker.sh"
}

if [[ "$TARGET" == "fix-backend" ]] || [[ "$FIX_BACKEND" -eq 1 ]]; then
  run_fix_backend
  if [[ "$TARGET" == "fix-backend" ]]; then
    exit 0
  fi
else
  ping_backend || true
fi

case "$TARGET" in
  ios)
    if [[ "$DO_IPA" -eq 1 ]]; then
      echo "==> production IPA (TestFlight / Transporter)"
      bash "$ROOT/scripts/mac-build-ipa-with-push.sh"
      echo ""
      echo "Sonraki:"
      echo "  1) Transporter ile IPA yükle → TestFlight Internal"
      echo "  2) iPhone’da TestFlight → ÇözBil yükle"
      echo "  3) App Store’daki eski build 17’yi kullanma (ölü API key)"
      exit 0
    fi
    echo "==> iPhone USB demo (dev-client)"
    bash "$ROOT/scripts/phone-dev-build.sh" ios "${PASSTHRU[@]+"${PASSTHRU[@]}"}"
    ;;
  android)
    echo "==> Android USB demo (dev-client)"
    bash "$ROOT/scripts/phone-dev-build.sh" android "${PASSTHRU[@]+"${PASSTHRU[@]}"}"
    ;;
  *)
    usage
    ;;
esac

echo ""
echo "✓ Demo kurulum adımı bitti."
echo "Smoke: onboarding → sınav seç (LGS/YGS/KPSS/Ehliyet) → galeri → çöz"
echo "Fixture: docs/qa/phone-solve-fixtures/"
echo "Backend hâlâ 403 ise: bash scripts/phone-demo-mac.sh fix-backend"
