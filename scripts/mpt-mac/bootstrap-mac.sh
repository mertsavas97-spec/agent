#!/usr/bin/env bash
# One-shot Mac local setup + open MoneyPrinterTurbo in Chrome (localhost).
# Usage (on Mac Terminal):
#   export PEXELS_API_KEY='your_key'
#   bash scripts/mpt-mac/bootstrap-mac.sh
#   # or after clone of this repo:
#   cd agent && bash scripts/mpt-mac/bootstrap-mac.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MPT_DIR="${MPT_DIR:-$HOME/MoneyPrinterTurbo}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This bootstrap is for macOS. On Linux use scripts/mpt-mac/install.sh only."
  exit 1
fi

if [[ -z "${PEXELS_API_KEY:-}" ]]; then
  echo "Set PEXELS_API_KEY first, e.g.:"
  echo "  export PEXELS_API_KEY='your_pexels_key'"
  exit 1
fi

export GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-mpt-shorts-260727}"
export GOOGLE_CLOUD_LOCATION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
export MPT_DIR

bash "$SCRIPT_DIR/install.sh"

cd "$MPT_DIR"

# Prefer local-only bind for Chrome on this Mac
export MPT_WEBUI_HOST="${MPT_WEBUI_HOST:-127.0.0.1}"
export MPT_WEBUI_PORT="${MPT_WEBUI_PORT:-8501}"

# ADC hint (Vertex). Edge TTS works without it; script gen needs Vertex/ADC or API key.
if [[ ! -f "$HOME/.config/gcloud/application_default_credentials.json" ]]; then
  echo
  echo "Optional (for Gemini/Vertex scripts):"
  echo "  gcloud auth application-default login"
  echo "  gcloud auth application-default set-quota-project $GOOGLE_CLOUD_PROJECT"
  echo
fi

# Open Chrome to local WebUI once server is up (background)
(
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null "http://127.0.0.1:${MPT_WEBUI_PORT}/"; then
      open -a "Google Chrome" "http://127.0.0.1:${MPT_WEBUI_PORT}/" 2>/dev/null \
        || open "http://127.0.0.1:${MPT_WEBUI_PORT}/"
      exit 0
    fi
    sleep 1
  done
) &

echo "==> Starting WebUI at http://127.0.0.1:${MPT_WEBUI_PORT}"
echo "    Chrome will open automatically when ready."
echo "    Stop with Ctrl+C"
echo
exec ./run-local.sh webui
