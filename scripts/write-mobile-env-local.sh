#!/usr/bin/env bash
# Mac: apps/mobile/.env.local’e Firebase public key UPSERT (diğer satırları silmez)
#
#   gcloud auth login   # bir kez
#   bash scripts/write-mobile-env-local.sh
#
# Varsayılan key: cozbil-firebase-client-20260730
# Override: COZBIL_FIREBASE_API_KEY_UID=... bash scripts/write-mobile-env-local.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
OUT="$MOBILE/.env.local"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
KEY_UID="${COZBIL_FIREBASE_API_KEY_UID:-319892bb-15f7-4eec-a115-f3fda1ead0fa}"
APP_ID="${EXPO_PUBLIC_FIREBASE_APP_ID:-1:717206185063:web:74256b15d50acb5c49a0c2}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "HATA: gcloud yok. Kur: brew install --cask google-cloud-sdk" >&2
  exit 1
fi

ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
if [[ -z "$ACCOUNT" ]]; then
  echo "HATA: gcloud auth login yap" >&2
  exit 1
fi

echo "==> project: $PROJECT"
echo "==> account: $ACCOUNT"
echo "==> key uid: $KEY_UID"
gcloud config set project "$PROJECT" >/dev/null

echo "==> keyString alınıyor (ekrana yazılmayacak)…"
KEY="$(
  gcloud services api-keys get-key-string "$KEY_UID" \
    --project="$PROJECT" \
    --format='value(keyString)' 2>/dev/null \
  || gcloud services api-keys get-key-string "$KEY_UID" \
    --project="$PROJECT" \
    --format='value(keyString)'
)"
KEY="${KEY#keyString: }"
KEY="$(echo "$KEY" | tr -d '[:space:]')"

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  echo "HATA: keyString alınamadı. Liste:" >&2
  gcloud services api-keys list --project="$PROJECT" --format='table(uid,displayName,createTime)' >&2 || true
  exit 1
fi

upsert() {
  local file="$1" name="$2" value="$3"
  touch "$file"
  local tmp
  tmp="$(mktemp)"
  grep -vE "^${name}=" "$file" >"$tmp" || true
  printf '%s\n' "${name}=${value}" >>"$tmp"
  mv "$tmp" "$file"
}

umask 077
touch "$OUT"
upsert "$OUT" "EXPO_PUBLIC_FIREBASE_API_KEY" "$KEY"
upsert "$OUT" "EXPO_PUBLIC_FIREBASE_APP_ID" "$APP_ID"
upsert "$OUT" "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "cozbil-dev-f9583.firebaseapp.com"
upsert "$OUT" "EXPO_PUBLIC_FIREBASE_PROJECT_ID" "cozbil-dev-f9583"
upsert "$OUT" "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "cozbil-dev-f9583.firebasestorage.app"
upsert "$OUT" "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "717206185063"

# Mirror Firebase keys into .env for Expo tooling that only reads .env
ENV_FILE="$MOBILE/.env"
touch "$ENV_FILE"
upsert "$ENV_FILE" "EXPO_PUBLIC_FIREBASE_API_KEY" "$KEY"
upsert "$ENV_FILE" "EXPO_PUBLIC_FIREBASE_APP_ID" "$APP_ID"
upsert "$ENV_FILE" "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "cozbil-dev-f9583.firebaseapp.com"
upsert "$ENV_FILE" "EXPO_PUBLIC_FIREBASE_PROJECT_ID" "cozbil-dev-f9583"
upsert "$ENV_FILE" "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "cozbil-dev-f9583.firebasestorage.app"
upsert "$ENV_FILE" "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "717206185063"

echo "✓ Upsert: $OUT (+ .env) — mevcut SOLVE_PROXY / Vision satırları korundu"
echo "  (API key gizli — cat etme / chat'e yapıştırma)"
echo ""
echo "Sonraki:"
echo "  bash scripts/phone-demo-proxy-mac.sh"
echo "  bash scripts/phone-dev-build.sh metro"
