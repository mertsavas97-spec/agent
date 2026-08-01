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

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  if KEY="$(create_gemini_key)"; then
    :
  else
    KEY=""
  fi
fi

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  if KEY="$(lift_existing_key_restrictions)"; then
    echo "✓ Gemini smoke OK (kısıt kaldırıldı)"
  else
    KEY=""
  fi
fi

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  echo "HATA: Gemini API key alınamadı." >&2
  echo "" >&2
  echo "Elle (AI Studio — en hızlı):" >&2
  echo "  1) https://aistudio.google.com/apikey  → Create API key (project: $PROJECT)" >&2
  echo "  2) apps/mobile/.env.local içine ekle:" >&2
  echo "       GEMINI_API_KEY=AIza...." >&2
  echo "  3) bash scripts/phone-demo-proxy-mac.sh" >&2
  echo "" >&2
  echo "Veya GCP Console → APIs & Services → Credentials → Create API key" >&2
  echo "  (Application restrictions: None; API restrictions: Don't restrict / Generative Language)" >&2
  exit 1
fi

echo "==> Gemini smoke (yazmadan önce)…"
if ! gemini_smoke "$KEY"; then
  echo "HATA: Key var ama smoke fail." >&2
  head -c 400 "$SMOKE_BODY" 2>/dev/null >&2 || true
  echo "" >&2
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
