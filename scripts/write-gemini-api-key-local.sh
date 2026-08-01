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
CREATE_ERR="${TMPDIR:-/tmp}/cozbil-gemini-key-create.err"
CREATE_OUT="${TMPDIR:-/tmp}/cozbil-gemini-key-create.out"
# Set by successful smoke — written to .env.local for proxy
SMOKE_MODEL=""
SMOKE_HTTP=""

# Models to try (API enable / regional availability varies)
SMOKE_MODELS=(
  gemini-2.5-flash
  gemini-2.0-flash
  gemini-2.0-flash-001
  gemini-1.5-flash
  gemini-1.5-flash-latest
)

gemini_smoke_once() {
  local key="$1"
  local model="$2"
  SMOKE_HTTP="$(
    curl -sS -o "$SMOKE_BODY" -w '%{http_code}' \
      "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}" \
      -H 'Content-Type: application/json' \
      -d '{"contents":[{"parts":[{"text":"Reply with one word: ok"}]}]}' \
      --max-time 45 || echo "000"
  )"
  [[ "$SMOKE_HTTP" == "200" ]]
}

# Print last smoke failure details (never print the API key)
print_smoke_fail() {
  local model="${1:-?}"
  echo "  smoke fail model=${model} HTTP=${SMOKE_HTTP:-?}" >&2
  if [[ -s "$SMOKE_BODY" ]]; then
    head -c 600 "$SMOKE_BODY" >&2 || true
    echo "" >&2
  else
    echo "  (boş yanıt gövdesi)" >&2
  fi
}

# Try models; optional retries with sleep (new key / newly-enabled API)
gemini_smoke() {
  local key="$1"
  local retries="${2:-1}"
  local attempt model
  attempt=1
  while ((attempt <= retries)); do
    if ((attempt > 1)); then
      echo "==> smoke retry ${attempt}/${retries} (API/key propagation)…" >&2
      sleep $((attempt * 8))
    fi
    for model in "${SMOKE_MODELS[@]}"; do
      echo "  → ${model}…" >&2
      if gemini_smoke_once "$key" "$model"; then
        SMOKE_MODEL="$model"
        return 0
      fi
      print_smoke_fail "$model"
      # 400 INVALID_ARGUMENT / model not found → try next model
      # 403/429 on all models → still try others once
    done
    attempt=$((attempt + 1))
  done
  return 1
}

key_string_for_uid() {
  local uid="$1"
  local k
  k="$(
    gcloud services api-keys get-key-string "$uid" \
      --project="$PROJECT" \
      --format='value(keyString)' 2>/dev/null || true
  )"
  k="${k#keyString: }"
  echo "$k" | tr -d '[:space:]'
}

# Create unrestricted key (Generative Language + Vision both work).
# Dual --api-target often fails or blocks Gemini; dogfood wants unrestricted.
create_gemini_key() {
  local name="cozbil-gemini-phone-$(date +%Y%m%d-%H%M%S)"
  local key_line uid_line
  echo "==> Yeni API key: $name (kısıtsız — Generative Language için)" >&2

  # Prefer sync create; capture stderr for the owner.
  if ! gcloud services api-keys create \
    --display-name="$name" \
    --project="$PROJECT" \
    --format='value(keyString)' >"$CREATE_OUT" 2>"$CREATE_ERR"; then
    echo "HATA: gcloud api-keys create başarısız:" >&2
    cat "$CREATE_ERR" >&2 || true
    return 1
  fi

  key_line="$(tr -d '[:space:]' <"$CREATE_OUT")"
  key_line="${key_line#keyString: }"
  if [[ -n "$key_line" && "$key_line" == AIza* ]]; then
    echo "$key_line"
    return 0
  fi

  # keyString not in create response — resolve by display name
  sleep 2
  uid_line="$(
    gcloud services api-keys list --project="$PROJECT" \
      --filter="displayName:$name" \
      --format='value(uid)' 2>/dev/null | head -n 1 | tr -d '[:space:]'
  )"
  if [[ -n "$uid_line" ]]; then
    echo "==> list→get-key-string: $uid_line" >&2
    key_line="$(key_string_for_uid "$uid_line")"
    if [[ -n "$key_line" && "$key_line" == AIza* ]]; then
      echo "$key_line"
      return 0
    fi
  fi

  echo "HATA: key oluşturuldu ama keyString alınamadı." >&2
  head -c 500 "$CREATE_OUT" >&2 || true
  echo "" >&2
  cat "$CREATE_ERR" >&2 || true
  return 1
}

# Existing Vision-only dogfood key → clear restrictions so Gemini works too.
lift_existing_key_restrictions() {
  echo "==> Mevcut cozbil/vision key kısıtları kaldırılıyor (Gemini için)…" >&2
  local uid name
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    uid="${row%%$'\t'*}"
    uid="${uid%% *}"
    name="${row#*$'\t'}"
    [[ -z "$uid" ]] && continue
    echo "==> update --clear-restrictions: $uid ($name)" >&2
    if gcloud services api-keys update "$uid" \
      --clear-restrictions \
      --project="$PROJECT" >/dev/null 2>"$CREATE_ERR"; then
      local k
      k="$(key_string_for_uid "$uid")"
      if [[ -n "$k" && "$k" == AIza* ]]; then
        if gemini_smoke "$k"; then
          echo "$k"
          return 0
        fi
        echo "  (kısıt kalktı ama smoke fail — sonraki key)" >&2
        head -c 200 "$SMOKE_BODY" 2>/dev/null >&2 || true
        echo "" >&2
      fi
    else
      echo "  (update fail)" >&2
      head -c 240 "$CREATE_ERR" >&2 || true
      echo "" >&2
    fi
  done < <(
    gcloud services api-keys list --project="$PROJECT" \
      --format='value(uid,displayName)' 2>/dev/null \
      | grep -iE 'vision|gemini|generative|cozbil' || true
  )
  return 1
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

echo "==> API enable (idempotent): Generative Language + API Keys"
gcloud services enable \
  generativelanguage.googleapis.com \
  apikeys.googleapis.com \
  --project="$PROJECT" >/dev/null || true

# Quota project hint (ADC mismatch warning)
gcloud auth application-default set-quota-project "$PROJECT" >/dev/null 2>&1 || true

CANDIDATES=()

# Optional: force brand-new / lift path (skip reuse of known-bad Vision key as-is)
if [[ "${FORCE_NEW_GEMINI_KEY:-}" == "1" ]]; then
  echo "==> FORCE_NEW_GEMINI_KEY=1 — mevcut key smoke atlanıyor; create/lift"
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

  # 2) Existing keys — gemini/generative names only (not bare cozbil-vision)
  echo "==> Mevcut Gemini/generative API key listeleniyor…"
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    uid="${row%%$'\t'*}"
    uid="${uid%% *}"
    [[ -z "$uid" ]] && continue
    echo "==> get-key-string: $uid"
    k="$(key_string_for_uid "$uid")"
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
if ((${#CANDIDATES[@]} > 0)); then
  for candidate in "${CANDIDATES[@]}"; do
    [[ -z "$candidate" || "$candidate" != AIza* ]] && continue
    echo "==> Gemini smoke (aday)…"
    if gemini_smoke "$candidate"; then
      KEY="$candidate"
      echo "✓ Gemini smoke OK (mevcut key)"
      break
    fi
    echo "  (aday fail — Vision-only / kısıtlı; sonraki aday)"
    head -c 240 "$SMOKE_BODY" 2>/dev/null >&2 || true
    echo "" >&2
  done
fi

CREATED_KEY=""
if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  if CREATED_KEY="$(create_gemini_key)"; then
    echo "==> Gemini smoke (yeni key — propagation retry)…"
    if gemini_smoke "$CREATED_KEY" 4; then
      KEY="$CREATED_KEY"
      echo "✓ Gemini smoke OK (yeni key, model=${SMOKE_MODEL})"
    else
      echo "==> Yeni key smoke fail — mevcut key kısıt kaldırma denenecek" >&2
      CREATED_KEY=""
    fi
  else
    CREATED_KEY=""
  fi
fi

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  if KEY="$(lift_existing_key_restrictions)"; then
    # lift already smoked once inside; re-smoke to set SMOKE_MODEL
    if gemini_smoke "$KEY" 2; then
      echo "✓ Gemini smoke OK (kısıt kaldırıldı, model=${SMOKE_MODEL})"
    else
      KEY=""
    fi
  else
    KEY=""
  fi
fi

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  echo "HATA: Gemini API key alınamadı / smoke geçmedi." >&2
  echo "" >&2
  echo "Son smoke HTTP=${SMOKE_HTTP:-?} — model listesi denendi." >&2
  if [[ -s "$SMOKE_BODY" ]]; then
    echo "Son yanıt:" >&2
    head -c 800 "$SMOKE_BODY" >&2 || true
    echo "" >&2
  fi
  # models.list often reveals API_KEY_INVALID / permission clearer than generateContent
  if [[ -n "${CREATED_KEY:-}" || -n "${KEY:-}" ]]; then
    _diag_key="${KEY:-$CREATED_KEY}"
    if [[ -n "$_diag_key" && "$_diag_key" == AIza* ]]; then
      echo "==> Tanı: models.list" >&2
      curl -sS "https://generativelanguage.googleapis.com/v1beta/models?key=${_diag_key}&pageSize=5" \
        --max-time 20 2>/dev/null | head -c 500 >&2 || true
      echo "" >&2
    fi
  fi
  echo "" >&2
  echo "Elle (AI Studio — en güvenilir):" >&2
  echo "  1) https://aistudio.google.com/apikey  → Create API key" >&2
  echo "     (Google AI Studio key; mümkünse project: $PROJECT)" >&2
  echo "  2) apps/mobile/.env.local:" >&2
  echo "       GEMINI_API_KEY=AIza...." >&2
  echo "  3) bash scripts/phone-demo-proxy-mac.sh" >&2
  echo "" >&2
  echo "GCP billing / Generative Language API açık mı kontrol et:" >&2
  echo "  https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=$PROJECT" >&2
  exit 1
fi

# Candidate path may have set KEY without SMOKE_MODEL
if [[ -z "$SMOKE_MODEL" ]]; then
  echo "==> Gemini smoke (yazmadan önce)…"
  if ! gemini_smoke "$KEY" 2; then
    echo "HATA: Key var ama smoke fail. HTTP=${SMOKE_HTTP:-?}" >&2
    head -c 600 "$SMOKE_BODY" 2>/dev/null >&2 || true
    echo "" >&2
    exit 1
  fi
fi
echo "✓ Gemini smoke OK (model=${SMOKE_MODEL})"

umask 077
touch "$OUT"
tmp="$(mktemp)"
grep -vE '^(GEMINI_API_KEY|GEMINI_SOLVE_MODEL|GEMINI_OCR_MODEL)=' "$OUT" >"$tmp" || true
{
  cat "$tmp"
  echo "GEMINI_API_KEY=${KEY}"
  echo "GEMINI_SOLVE_MODEL=${SMOKE_MODEL}"
  echo "GEMINI_OCR_MODEL=${SMOKE_MODEL}"
} >"$OUT"
rm -f "$tmp"

echo "✓ Yazıldı: $OUT (GEMINI_API_KEY)"
echo "  (key gizli — cat etme / chat'e yapıştırma)"
echo ""
echo "Sonraki:"
echo "  bash scripts/phone-demo-proxy-mac.sh"
echo "  bash scripts/phone-dev-build.sh metro"
