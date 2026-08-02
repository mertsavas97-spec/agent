#!/usr/bin/env bash
# Grant Gen2 solve trigger runtime SA the IAM it needs for Firestore + Storage.
#
# Symptom (Functions log):
#   onSolveUploadFinalized: path match without tag — processing {…}
#   Error: 7 PERMISSION_DENIED: Missing or insufficient permissions.
#   (stack: @google-cloud/firestore …)
#
# Gen2 runs as PROJECT_NUMBER-compute@developer.gserviceaccount.com by default.
# Without roles/datastore.user the Admin SDK cannot claim solveRequests →
# client sees "çözüm servisine ulaşılamadı" after upload.
#
# Mac / owner (hello@summify.app):
#   bash scripts/fix-solve-runtime-iam.sh
# Then TestFlight’ta tekrar fotoğraf dene (yeni IPA gerekmez).

set -euo pipefail

PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud yok. https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
echo "==> project: $PROJECT"
echo "==> account: ${ACCOUNT:-"(yok)"}"

gcloud config set project "$PROJECT" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
EVENTARC_SA="service-${PROJECT_NUMBER}@gcp-sa-eventarc.iam.gserviceaccount.com"
ADMIN_SA="firebase-adminsdk-fbsvc@${PROJECT}.iam.gserviceaccount.com"

bind_role() {
  local member="$1"
  local role="$2"
  echo "  + $role → $member"
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${member}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
}

echo "==> IAM: compute runtime SA"
bind_role "$COMPUTE_SA" "roles/datastore.user"
bind_role "$COMPUTE_SA" "roles/storage.objectAdmin"
bind_role "$COMPUTE_SA" "roles/aiplatform.user"
# Vision SafeSearch via ADC (optional; ignore if role unavailable on project)
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/serviceusage.serviceUsageConsumer" \
  --condition=None \
  --quiet >/dev/null 2>&1 || true

if gcloud iam service-accounts describe "$ADMIN_SA" --project="$PROJECT" >/dev/null 2>&1; then
  echo "==> IAM: firebase-adminsdk (yedek)"
  bind_role "$ADMIN_SA" "roles/datastore.user"
  bind_role "$ADMIN_SA" "roles/storage.objectAdmin"
  bind_role "$ADMIN_SA" "roles/aiplatform.user"
fi

echo "==> Eventarc → Cloud Run invoker (Gen2 Storage trigger)"
for svc in onsolveuploadfinalized onsolverequestcreatedv2; do
  if gcloud run services describe "$svc" --region=europe-west1 --project="$PROJECT" >/dev/null 2>&1; then
    echo "  + roles/run.invoker → $EVENTARC_SA on $svc"
    gcloud run services add-iam-policy-binding "$svc" \
      --project="$PROJECT" \
      --region=europe-west1 \
      --member="serviceAccount:${EVENTARC_SA}" \
      --role="roles/run.invoker" \
      --quiet >/dev/null 2>&1 || true
    # Also allow the default compute SA (some Eventarc paths use it)
    gcloud run services add-iam-policy-binding "$svc" \
      --project="$PROJECT" \
      --region=europe-west1 \
      --member="serviceAccount:${COMPUTE_SA}" \
      --role="roles/run.invoker" \
      --quiet >/dev/null 2>&1 || true
  fi
done

echo ""
echo "✓ IAM güncellendi."
echo "  Runtime SA: $COMPUTE_SA"
echo "  Sonraki: TestFlight’ta fotoğraf çek / galeriden seç."
echo "  Log: firebase functions:log --project $PROJECT --only onSolveUploadFinalized -n 20"
echo "  Beklenen: executeSolvePipeline aiBackend vertex|demo  (PERMISSION_DENIED olmamalı)"
