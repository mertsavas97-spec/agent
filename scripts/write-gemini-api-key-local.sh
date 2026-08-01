#!/usr/bin/env bash
# Mac: GEMINI_API_KEY → apps/mobile/.env.local (chat/PR/commit yok)
#
# Vision-only API key Generative Language’i engeller → Gemini solve fail → OCR.
# Bu script Generative Language API’yi açar ve uygun key yazar.
#
#   gcloud auth login   # bir kez
#   bash scripts/write-gemini-api-key-local.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/apps/mobile/.env.local"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"

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

echo "==> Generative Language API enable (idempotent)"
gcloud services enable generativelanguage.googleapis.com --project="$PROJECT" >/dev/null || true

KEY=""

# 1) Prefer existing GEMINI / unrestricted key from Secret Manager
for SECRET_NAME in GEMINI_API_KEY GOOGLE_GENERATIVE_AI_API_KEY; do
  if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT" >/dev/null 2>&1; then
    echo "==> Secret Manager: $SECRET_NAME"
    KEY="$(
      gcloud secrets versions access latest \
        --secret="$SECRET_NAME" \
        --project="$PROJECT" 2>/dev/null || true
    )"
    KEY="$(echo "$KEY" | tr -d '[:space:]')"
    if [[ -n "$KEY" && "$KEY" == AIza* ]]; then
      break
    fi
  fi
done

# 2) Existing API key with gemini / generative in display name
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
      --format='value(uid,displayName)' 2>/dev/null | grep -iE 'gemini|generative|ai-studio|cozbil' || true
  )
fi

# 3) Create key that can call Generative Language (+ Vision for OCR fallback)
if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  NAME="cozbil-gemini-phone-$(date +%Y%m%d)"
  echo "==> Yeni API key: $NAME (Generative Language + Vision)"
  KEY="$(
    gcloud services api-keys create \
      --display-name="$NAME" \
      --api-target=service=generativelanguage.googleapis.com \
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
  echo "HATA: Gemini API key alınamadı." >&2
  echo "Konsol: APIs & Services → Credentials → Create API key (Generative Language)." >&2
  exit 1
fi

# Smoke: key must actually call Gemini
echo "==> Gemini smoke…"
SMOKE_HTTP="$(
  curl -sS -o /tmp/cozbil-gemini-smoke.json -w '%{http_code}' \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}" \
    -H 'Content-Type: application/json' \
    -d '{"contents":[{"parts":[{"text":"Reply with JSON only: {\"ok\":true}"}]}]}' \
    --max-time 30 || echo "000"
)"
if [[ "$SMOKE_HTTP" != "200" ]]; then
  echo "HATA: Gemini smoke HTTP $SMOKE_HTTP" >&2
  head -c 400 /tmp/cozbil-gemini-smoke.json 2>/dev/null >&2 || true
  echo "" >&2
  echo "Vision-only kısıtlı key olabilir. Yeni key oluştur veya Generative Language’i key’e ekle." >&2
  exit 1
fi
echo "✓ Gemini smoke OK"

umask 077
touch "$OUT"
tmp="$(mktemp)"
grep -vE '^GEMINI_API_KEY=' "$OUT" >"$tmp" || true
{
  cat "$tmp"
  echo "GEMINI_API_KEY=${KEY}"
} >"$OUT"
rm -f "$tmp"

echo "✓ Yazıldı: $OUT (GEMINI_API_KEY)"
echo "  (key gizli — cat etme / chat'e yapıştırma)"
echo ""
echo "Sonraki:"
echo "  bash scripts/phone-demo-proxy-mac.sh"
echo "  bash scripts/phone-dev-build.sh metro"
