#!/usr/bin/env bash
# ÇözBil — Cloud Functions Invoker 403 düzeltmesi
#
# Mac'te (Firebase/GCP sahibi hesapla):
#   gcloud auth login
#   gcloud config set project cozbil-dev-f9583
#   bash scripts/fix-functions-invoker.sh
#
# Org policy allUsers'ı engelliyorsa bu script hata basar → org admin istisnası gerekir.

set -euo pipefail

PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
REGION="${FUNCTION_REGION:-europe-west1}"
FUNCS=(
  ping
  ensureUser
  completeOnboarding
  updateExamType
  requestAccountDeletion
  solveQuestion
  explainAgain
  listAttempts
  getProgressSummary
)

echo "==> Project: $PROJECT  Region: $REGION"
gcloud config set project "$PROJECT" >/dev/null

echo "==> Auth check"
ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
[[ -n "$ACCOUNT" ]] || { echo "HATA: gcloud auth login yap"; exit 1; }
echo "    account: $ACCOUNT"

fail_org=0

for fn in "${FUNCS[@]}"; do
  echo ""
  echo "==> Invoker → $fn"
  if gcloud functions add-iam-policy-binding "$fn" \
    --project="$PROJECT" \
    --region="$REGION" \
    --member="allUsers" \
    --role="roles/cloudfunctions.invoker" \
    --quiet 2> /tmp/cozbil-iam-err.txt; then
    echo "    OK allUsers invoker"
  else
    echo "    FAIL allUsers:"
    cat /tmp/cozbil-iam-err.txt | tail -8
    if grep -qiE 'org|policy|constraint|failedPrecondition|DENIED' /tmp/cozbil-iam-err.txt; then
      fail_org=1
    fi
    echo "    Trying allAuthenticatedUsers…"
    if gcloud functions add-iam-policy-binding "$fn" \
      --project="$PROJECT" \
      --region="$REGION" \
      --member="allAuthenticatedUsers" \
      --role="roles/cloudfunctions.invoker" \
      --quiet 2>> /tmp/cozbil-iam-err.txt; then
      echo "    OK allAuthenticatedUsers (callable bazen yine 403 olabilir — allUsers tercih)"
    else
      echo "    FAIL allAuthenticatedUsers too"
      fail_org=1
    fi
  fi
done

echo ""
echo "==> ping smoke"
CODE="$(curl -sS -o /tmp/cozbil-ping.json -w '%{http_code}' \
  "https://${REGION}-${PROJECT}.cloudfunctions.net/ping" || true)"
echo "    HTTP $CODE"
head -c 400 /tmp/cozbil-ping.json 2>/dev/null; echo

if [[ "$CODE" == "200" ]]; then
  echo "✓ Functions erişilebilir — telefonda solve tekrar dene."
  exit 0
fi

echo ""
echo "✗ ping hâlâ $CODE"
if [[ "$fail_org" -eq 1 ]]; then
  cat <<EOF

Org policy muhtemelen allUsers/allAuthenticatedUsers invoker’ı engelliyor.
Sadece proje Owner yetmez → Organization Policy Admin gerekir:

  Constraint örnekleri:
  - iam.allowedPolicyMemberDomains
  - iam.managed.disableServiceAccountKeyCreation (ilgili değil)
  - constraints/iam.allowedPolicyMemberDomains
  - Cloud Functions / Cloud Run “Domain restricted sharing”

Konsol: IAM & Admin → Organization Policies → ilgili kısıtı
bu proje için exception (allow allUsers) ver.
EOF
fi
exit 2
