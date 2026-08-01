#!/usr/bin/env bash
# Mac: GEMINI_API_KEY → apps/mobile/.env.local (chat/PR/commit yok)
#
# Vision-only API key Generative Language’i engeller → Gemini solve fail → OCR.
# Bu script Generative Language API’yi açar, smoke geçen key yazar.
#
#   gcloud auth login   # bir kez
#   bash scripts/write-gemini-api-key-local.sh
#   FORCE_NEW_GEMINI_KEY=1 bash scripts/write-gemini-api-key-local.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/apps/mobile/.env.local"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
SMOKE_BODY="${TMPDIR:-/tmp}/cozbil-gemini-smoke.json"

gemini_smoke() {
  local key="$1"
  local http
  http="$(
    curl -sS -o "$SMOKE_BODY" -w '%{http_code}' \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}" \
      -H 'Content-Type: application/json' \
      -d '{"contents":[{"parts":[{"text":"Reply with JSON only: {\"ok\":true}"}]}]}' \
      --max-time 30 || echo "000"
  )"
  [[ "$http" == "200" ]]
}

create_gemini_key() {
  local name="cozbil-gemini-phone-$(date +%Y%m%d-%H%M%S)"
  echo "==> Yeni API key: $name (Generative Language + Vision)" >&2
  local created
  created="$(
    gcloud services api-keys create \
      --display-name="$name" \
      --api-target=service=generativelanguage.googleapis.com \
      --api-target=service=vision.googleapis.com \
      --project="$PROJECT" \
      --format='value(keyString)' 2>/dev/null \
    || gcloud services api-keys create \
      --display-name="$name" \
      --project="$PROJECT" \
      --format='value(keyString)'
  )"
  created="${created#keyString: }"
  created="$(echo "$created" | tr -d '[:space:]')"
  echo "$created"
}

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

CANDIDATES=()

# Optional: force brand-new key (skip reuse)
if [[ "${FORCE_NEW_GEMINI_KEY:-}" == "1" ]]; then
  echo "==> FORCE_NEW_GEMINI_KEY=1 — mevcut key atlanıyor"
else
  # 1) Secret Manager
  for SECRET_NAME in GEMINI_API_KEY GOOGLE_GENERATIVE_AI_API_KEY; do
    if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT" >/dev/null 2>&1; then
      echo "==> Secret Manager: $SECRET_NAME"
      secret_key="$(
        gcloud secrets versions access latest \
          --secret="$SECRET_NAME" \
          --project="$PROJECT" 2>/dev/null || true
      )"
      secret_key="$(echo "$secret_key" | tr -d '[:space:]')"
      if [[ -n "$secret_key" && "$secret_key" == AIza* ]]; then
        CANDIDATES+=("$secret_key")
      fi
    fi
  done

  # 2) Existing keys — ONLY gemini/generative names (NOT bare "cozbil":
  #    that matches Vision-only cozbil-vision-phone-* and fails smoke 400)
  echo "==> Mevcut Gemini/generative API key listeleniyor…"
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    uid="${row%%$'\t'*}"
    uid="${uid%% *}"
    [[ -z "$uid" ]] && continue
    echo "==> get-key-string: $uid"
    k="$(
      gcloud services api-keys get-key-string "$uid" \
        --project="$PROJECT" \
        --format='value(keyString)' 2>/dev/null || true
    )"
    k="${k#keyString: }"
    k="$(echo "$k" | tr -d '[:space:]')"
    if [[ -n "$k" && "$k" == AIza* ]]; then
      CANDIDATES+=("$k")
    fi
  done < <(
    gcloud services api-keys list --project="$PROJECT" \
      --format='value(uid,displayName)' 2>/dev/null \
      | grep -iE 'gemini|generative|ai-studio' || true
  )
fi

KEY=""
# bash 3.2 + set -u: empty array for-loop is unsafe — guard length
if ((${#CANDIDATES[@]} > 0)); then
  for candidate in "${CANDIDATES[@]}"; do
    [[ -z "$candidate" || "$candidate" != AIza* ]] && continue
    echo "==> Gemini smoke (aday)…"
    if gemini_smoke "$candidate"; then
      KEY="$candidate"
      echo "✓ Gemini smoke OK (mevcut key)"
      break
    fi
    echo "  (aday fail — Vision-only / kısıtlı; sonraki aday veya yeni key)"
    head -c 240 "$SMOKE_BODY" 2>/dev/null >&2 || true
    echo "" >&2
  done
fi

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  KEY="$(create_gemini_key)"
  if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
    echo "HATA: Gemini API key oluşturulamadı." >&2
    echo "Konsol: APIs & Services → Credentials → Create API key (Generative Language)." >&2
    exit 1
  fi
  echo "==> Gemini smoke (yeni key)…"
  if ! gemini_smoke "$KEY"; then
    echo "HATA: Yeni key smoke fail — Generative Language API / kota kontrol et." >&2
    head -c 400 "$SMOKE_BODY" 2>/dev/null >&2 || true
    echo "" >&2
    exit 1
  fi
  echo "✓ Gemini smoke OK (yeni key)"
fi

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
