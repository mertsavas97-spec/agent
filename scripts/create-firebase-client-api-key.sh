#!/usr/bin/env bash
# Mac: Create a new unrestricted Browser-style API key for ÇözBil Firebase client.
# Does NOT print the key into git. Shows it once in Terminal — copy to EAS/Cursor secrets only.
#
# Prereq (one time):
#   brew install --cask google-cloud-sdk   # if gcloud missing
#   gcloud auth login
#
# Usage:
#   bash scripts/create-firebase-client-api-key.sh

set -euo pipefail
PROJECT="${GCP_PROJECT_ID:-cozbil-dev-f9583}"
NAME="cozbil-firebase-client-$(date +%Y%m%d)"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud yok. Kur: https://cloud.google.com/sdk/docs/install" >&2
  echo "Sonra: gcloud auth login" >&2
  exit 1
fi

echo "==> project: $PROJECT"
gcloud config set project "$PROJECT" >/dev/null

echo "==> yeni API key oluşturuluyor: $NAME"
# Unrestricted key (same as Application restrictions = None). Tighten later in Console if desired.
JSON="$(gcloud services api-keys create \
  --display-name="$NAME" \
  --format=json)"

KEY="$(echo "$JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["keyString"])')"
RESOURCE="$(echo "$JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("name",""))')"

echo ""
echo "✓ Key oluşturuldu."
echo "  displayName: $NAME"
echo "  resource:    $RESOURCE"
echo ""
echo "=== KEY (bir kez gösterilir — chat/PR/commit'e YAPISTIRMA) ==="
echo "$KEY"
echo "================================================================"
echo ""
echo "Sonraki adımlar (siz):"
echo "  1) Cursor Cloud Secrets → EXPO_PUBLIC_FIREBASE_API_KEY = bu key"
echo "  2) EAS production env → aynı isim"
echo "  3) Yeni IPA: git checkout cursor/scrub-google-api-key-pr31-4710 && bash scripts/mac-build-ipa-with-push.sh"
echo "  4) Eski sızan key'i GCP Credentials'dan sil"
echo "  5) GitHub Secret scanning alert → Revoked"
echo ""
echo "Bu Terminal penceresini kapatınca key kaybolur; secrets'a hemen yapıştırın."
