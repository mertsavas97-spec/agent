#!/usr/bin/env bash
# Mac: Create a new API key for ÇözBil Firebase client (Expo EXPO_PUBLIC_FIREBASE_API_KEY).
# Never paste the key into chat / PR / commit — only Cursor Cloud + EAS secrets.
#
#   gcloud auth login   # once
#   bash scripts/create-firebase-client-api-key.sh

set -euo pipefail
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
NAME="cozbil-firebase-client-$(date +%Y%m%d)"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud yok." >&2
  exit 1
fi

echo "==> project: $PROJECT"
gcloud config set project "$PROJECT" >/dev/null

echo "==> yeni API key: $NAME"
# value() avoids Operation-wrapper JSON that broke python parsing.
KEY="$(
  gcloud services api-keys create \
    --display-name="$NAME" \
    --format='value(keyString)'
)"

if [[ -z "$KEY" || "$KEY" != AIza* ]]; then
  echo "error: keyString alınamadı. Credentials listesine bakın veya:" >&2
  echo "  gcloud services api-keys list --project=$PROJECT" >&2
  exit 1
fi

echo ""
echo "✓ Key oluşturuldu: $NAME"
echo ""
echo "=== KEY (chat/PR'a YAPISTIRMA — Cursor Cloud + EAS'e koy) ==="
echo "$KEY"
echo "=============================================================="
echo ""
echo "Sonraki:"
echo "  1) Cursor Cloud Secrets + EAS production → EXPO_PUBLIC_FIREBASE_API_KEY"
echo "  2) Yeni IPA (scrub branch)"
echo "  3) Eski sızan key'i GCP'den sil → GitHub alert Revoked"
