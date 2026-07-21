#!/usr/bin/env bash
# ÇözBil — GCP Startup + Firebase canlı kurulum (owner bir kez çalıştırır)
#
# Ne yapar:
#   1) gcloud + firebase-tools kurar (yoksa)
#   2) Login kontrolü (gerekirse tarayıcı URL verir)
#   3) Gerekli API'leri açar (Vertex AI, Vision, …)
#   4) functions/.env.<project> oluşturur (Vertex live)
#   5) Functions deploy + ping smoke
#
# Kullanım:
#   bash scripts/gcp-startup-live-setup.sh
#   bash scripts/gcp-startup-live-setup.sh --deploy
#   bash scripts/gcp-startup-live-setup.sh --login-only

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
BILLING_ACCOUNT="${COZBIL_BILLING_ACCOUNT:-01F6A9-B52CDE-B4D709}"
REGION="${FUNCTION_REGION:-europe-west1}"
VERTEX_REGION="${VERTEX_LOCATION:-us-central1}"
TOOLS="$ROOT/.tools"
DEPLOY=0
LOGIN_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --deploy) DEPLOY=1 ;;
    --login-only) LOGIN_ONLY=1 ;;
  esac
done

export PATH="$TOOLS/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

resolve_gcloud() {
  if command -v gcloud >/dev/null 2>&1; then
    command -v gcloud
    return
  fi
  if [[ -x "$TOOLS/google-cloud-sdk/bin/gcloud" ]]; then
    echo "$TOOLS/google-cloud-sdk/bin/gcloud"
    return
  fi
  echo "→ Google Cloud SDK kuruluyor ($TOOLS)…" >&2
  mkdir -p "$TOOLS"
  curl -fsSL https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz \
    | tar -xz -C "$TOOLS" >&2
  "$TOOLS/google-cloud-sdk/install.sh" --quiet --path-update false --command-completion false >&2
  echo "$TOOLS/google-cloud-sdk/bin/gcloud"
}

resolve_firebase() {
  if command -v firebase >/dev/null 2>&1; then
    echo "firebase"
    return
  fi
  if [[ -x "$TOOLS/node_modules/.bin/firebase" ]]; then
    echo "$TOOLS/node_modules/.bin/firebase"
    return
  fi
  echo "→ firebase-tools kuruluyor…" >&2
  mkdir -p "$TOOLS"
  npm install --prefix "$TOOLS" firebase-tools@latest --no-fund --no-audit
  echo "$TOOLS/node_modules/.bin/firebase"
}

GCLOUD="$(resolve_gcloud)"
FIREBASE="$(resolve_firebase)"
export PATH="$(dirname "$GCLOUD"):$PATH"

echo "=============================================="
echo "ÇözBil GCP Startup live setup"
echo "Project: $PROJECT"
echo "Functions region: $REGION"
echo "Vertex region: $VERTEX_REGION"
echo "=============================================="

ensure_login() {
  local acct
  acct="$("$GCLOUD" auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1 || true)"
  if [[ -z "$acct" ]]; then
    echo ""
    echo ">>> gcloud login (Startup hesabın):"
    echo "    URL + kod aşağıda — tarayıcıda aç, onayla."
    "$GCLOUD" auth login --no-launch-browser
    acct="$("$GCLOUD" auth list --filter=status:ACTIVE --format='value(account)' | head -1)"
  fi
  echo "✓ gcloud account: $acct"

  if ! "$FIREBASE" projects:list --project "$PROJECT" >/dev/null 2>&1; then
    echo ""
    echo ">>> Firebase CLI login:"
    "$FIREBASE" login --no-localhost
  fi
  echo "✓ firebase CLI OK"

  echo ">>> ADC (lokal smoke; Cloud'da runtime SA yeterli):"
  "$GCLOUD" auth application-default login --no-launch-browser \
    || echo "    (ADC atlandı)"
}

"$GCLOUD" config set project "$PROJECT" >/dev/null

ensure_login

if [[ "$LOGIN_ONLY" -eq 1 ]]; then
  echo "Login tamam. Deploy için: bash scripts/gcp-startup-live-setup.sh --deploy"
  exit 0
fi

echo ""
echo "==> Billing bağlantısı kontrol"
if ! "$GCLOUD" billing projects describe "$PROJECT" --format='value(billingEnabled)' 2>/dev/null | grep -q true; then
  echo "Billing bağlanıyor → $BILLING_ACCOUNT"
  "$GCLOUD" billing projects link "$PROJECT" --billing-account="$BILLING_ACCOUNT" \
    || echo "UYARI: Billing link başarısız — Console'dan manuel bağla"
fi

echo ""
echo "==> API'ler açılıyor"
APIS=(
  aiplatform.googleapis.com
  vision.googleapis.com
  cloudfunctions.googleapis.com
  firestore.googleapis.com
  storage.googleapis.com
  firebase.googleapis.com
  run.googleapis.com
  artifactregistry.googleapis.com
  cloudbuild.googleapis.com
)
for api in "${APIS[@]}"; do
  echo "  enable $api"
  "$GCLOUD" services enable "$api" --project="$PROJECT" --quiet || true
done

echo ""
echo "==> Functions env dosyası"
ENV_FILE="$ROOT/functions/.env.$PROJECT"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/functions/.env.$PROJECT.example" "$ENV_FILE"
  echo "  oluşturuldu: functions/.env.$PROJECT"
else
  echo "  mevcut: functions/.env.$PROJECT"
fi

echo ""
echo "==> IAM (Vertex — runtime service accounts)"
PROJECT_NUMBER="$("$GCLOUD" projects describe "$PROJECT" --format='value(projectNumber)')"
for sa in \
  "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  "firebase-adminsdk-fbsvc@${PROJECT}.iam.gserviceaccount.com"; do
  if "$GCLOUD" iam service-accounts describe "$sa" --project="$PROJECT" >/dev/null 2>&1; then
    echo "  roles/aiplatform.user → $sa"
    "$GCLOUD" projects add-iam-policy-binding "$PROJECT" \
      --member="serviceAccount:$sa" \
      --role="roles/aiplatform.user" \
      --quiet >/dev/null 2>&1 || true
    echo "  roles/visionai.user → $sa"
    "$GCLOUD" projects add-iam-policy-binding "$PROJECT" \
      --member="serviceAccount:$sa" \
      --role="roles/visionai.user" \
      --quiet >/dev/null 2>&1 || true
  fi
done

if [[ "$DEPLOY" -ne 1 ]]; then
  echo ""
  echo "Kurulum hazır. Deploy için:"
  echo "  bash scripts/gcp-startup-live-setup.sh --deploy"
  echo "  bash scripts/fix-functions-invoker.sh"
  exit 0
fi

echo ""
echo "==> Build + deploy"
(cd "$ROOT/functions" && npm ci && npm run build)
"$FIREBASE" deploy --project "$PROJECT" --only functions,firestore:rules,storage

echo ""
echo "==> Invoker (callable erişimi)"
bash "$ROOT/scripts/fix-functions-invoker.sh" || true

echo ""
echo "==> ping smoke"
CODE="$(curl -sS -o /tmp/cozbil-ping.json -w '%{http_code}' \
  "https://${REGION}-${PROJECT}.cloudfunctions.net/ping" || true)"
echo "HTTP $CODE"
cat /tmp/cozbil-ping.json 2>/dev/null | head -c 600; echo
if [[ "$CODE" == "200" ]]; then
  if grep -q '"aiMode":"live"' /tmp/cozbil-ping.json 2>/dev/null \
    && grep -q '"aiBackend":"vertex"' /tmp/cozbil-ping.json 2>/dev/null; then
    echo "✓ Canlı Vertex modu aktif (Startup billing)"
  else
    echo "⚠ ping 200 ama aiMode/backend kontrol et (env deploy?)"
  fi
else
  echo "✗ ping başarısız — invoker veya deploy kontrol et"
  exit 2
fi
