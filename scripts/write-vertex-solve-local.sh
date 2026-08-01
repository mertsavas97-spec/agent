#!/usr/bin/env bash
# Mac: dogfood Gemini via Vertex AI (gcloud ADC) — not Cloud Console API keys.
#
# Org / Generative Language: GCP API keys → API_KEY_INVALID.
# AI Studio keys → ayrı cüzdan. Vertex → Startup billing (docs/setup/VERTEX_STARTUP.md).
#
#   gcloud auth login   # bir kez
#   bash scripts/write-vertex-solve-local.sh
#
# Writes to apps/mobile/.env.local:
#   COZBIL_USE_VERTEX=1
#   GCP_PROJECT_ID=…
#   VERTEX_LOCATION=…
#   VERTEX_MODEL=…

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/apps/mobile/.env.local"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
LOCATION="${VERTEX_LOCATION:-us-central1}"
MODEL="${VERTEX_MODEL:-gemini-2.5-flash}"
SMOKE_BODY="${TMPDIR:-/tmp}/cozbil-vertex-smoke.json"

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
echo "==> Vertex: ${LOCATION} / ${MODEL}"
gcloud config set project "$PROJECT" >/dev/null

echo "==> API enable (idempotent): Vertex AI"
gcloud services enable aiplatform.googleapis.com --project="$PROJECT" >/dev/null || true
gcloud auth application-default set-quota-project "$PROJECT" >/dev/null 2>&1 || true

TOKEN="$(gcloud auth print-access-token 2>/dev/null || true)"
if [[ -z "$TOKEN" ]]; then
  echo "HATA: gcloud auth print-access-token boş — gcloud auth login" >&2
  exit 1
fi

URL="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent"
echo "==> Vertex smoke…"
HTTP="$(
  curl -sS -o "$SMOKE_BODY" -w '%{http_code}' \
    "$URL" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H 'Content-Type: application/json' \
    -d '{"contents":[{"role":"user","parts":[{"text":"Reply with one word: ok"}]}]}' \
    --max-time 45 || echo "000"
)"
if [[ "$HTTP" != "200" ]]; then
  echo "HATA: Vertex smoke HTTP $HTTP" >&2
  head -c 600 "$SMOKE_BODY" 2>/dev/null >&2 || true
  echo "" >&2
  echo "Kontrol:" >&2
  echo "  • Billing / Startup: docs/setup/VERTEX_STARTUP.md" >&2
  echo "  • IAM: roles/aiplatform.user (hesabın: $ACCOUNT)" >&2
  echo "  • https://console.cloud.google.com/vertex-ai?project=$PROJECT" >&2
  exit 1
fi
echo "✓ Vertex smoke OK"

umask 077
touch "$OUT"
tmp="$(mktemp)"
grep -vE '^(COZBIL_USE_VERTEX|GCP_PROJECT_ID|GOOGLE_CLOUD_PROJECT|VERTEX_LOCATION|VERTEX_MODEL)=' "$OUT" >"$tmp" || true
{
  cat "$tmp"
  echo "COZBIL_USE_VERTEX=1"
  echo "GCP_PROJECT_ID=${PROJECT}"
  echo "GOOGLE_CLOUD_PROJECT=${PROJECT}"
  echo "VERTEX_LOCATION=${LOCATION}"
  echo "VERTEX_MODEL=${MODEL}"
} >"$OUT"
rm -f "$tmp"

echo "✓ Yazıldı: $OUT (COZBIL_USE_VERTEX=1)"
echo ""
echo "Sonraki:"
echo "  bash scripts/phone-demo-proxy-mac.sh"
echo "  bash scripts/phone-dev-build.sh metro"
