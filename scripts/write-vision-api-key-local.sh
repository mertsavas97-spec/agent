#!/usr/bin/env bash
# Mac: GOOGLE_CLOUD_VISION_API_KEY → apps/mobile/.env.local (chat/PR/commit yok)
#
#   gcloud auth login   # bir kez
#   bash scripts/write-vision-api-key-local.sh
#
# Sıra: Secret Manager → mevcut "vision" adlı key → yeni key oluştur

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/apps/mobile/.env.local"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
SECRET_NAME="${COZBIL_VISION_SECRET:-GOOGLE_CLOUD_VISION_API_KEY}"

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
gcloud config set project "$PROJECT" >/dev/null

echo "==> Vision API enable (idempotent)"
gcloud services enable vision.googleapis.com --project="$PROJECT" >/dev/null || true

KEY=""

# 1) Secret Manager
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT" >/dev/null 2>&1; then
  echo "==> Secret Manager: $SECRET_NAME"
  KEY="$(
    gcloud secrets versions access latest \
      --secret="$SECRET_NAME" \
      --project="$PROJECT" 2>/dev/null || true
  )"
  KEY="$(echo "$KEY" | tr -d '[:space:]')"
fi

# 2) Existing API key with "vision" in display name
# (macOS /bin/bash 3.2 has no mapfile — use while-read)
if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  echo "==> Mevcut API key listeleniyor…"
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    uid="${row%%$'\t'*}"
    uid="${uid%% *}"
    [[ -z "$uid" ]] && continue
    echo "==> get-key-string: $uid"
    KEY="$(
      gcloud services api-keys get-key-string "$uid" \
        --project="$PROJECT" \
        --format='value(keyString)' 2>/dev/null || true
    )"
    KEY="${KEY#keyString: }"
    KEY="$(echo "$KEY" | tr -d '[:space:]')"
    if [[ -n "$KEY" && "$KEY" == AIza* ]]; then
      break
    fi
  done < <(
    gcloud services api-keys list --project="$PROJECT" \
      --format='value(uid,displayName)' 2>/dev/null | grep -i vision || true
  )
fi

# 3) Create new key
if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  NAME="cozbil-vision-phone-$(date +%Y%m%d)"
  echo "==> Yeni API key: $NAME"
  KEY="$(
    gcloud services api-keys create \
      --display-name="$NAME" \
      --api-target=service=vision.googleapis.com \
      --project="$PROJECT" \
      --format='value(keyString)' 2>/dev/null \
    || gcloud services api-keys create \
      --display-name="$NAME" \
      --project="$PROJECT" \
      --format='value(keyString)'
  )"
  KEY="${KEY#keyString: }"
  KEY="$(echo "$KEY" | tr -d '[:space:]')"
fi

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  echo "HATA: Vision API key alınamadı." >&2
  echo "Konsol: APIs & Services → Credentials → Create API key (Vision)." >&2
  exit 1
fi

umask 077
touch "$OUT"
tmp="$(mktemp)"
grep -vE '^GOOGLE_CLOUD_VISION_API_KEY=' "$OUT" >"$tmp" || true
{
  cat "$tmp"
  echo "GOOGLE_CLOUD_VISION_API_KEY=${KEY}"
} >"$OUT"
rm -f "$tmp"

echo "✓ Yazıldı: $OUT (GOOGLE_CLOUD_VISION_API_KEY)"
echo "  (key gizli — cat etme / chat'e yapıştırma)"
echo ""
echo "Sonraki:"
echo "  bash scripts/phone-demo-proxy-mac.sh"
echo "  bash scripts/phone-dev-build.sh metro"
