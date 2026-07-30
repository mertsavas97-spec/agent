#!/usr/bin/env bash
# One-shot: install NarratoAI on Mac Desktop + open Chrome (local, no Remote).
# Shares Vertex / Startup project with MoneyPrinterTurbo (mpt-shorts-260727).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Run this on your Mac Terminal (Desktop install)."
  exit 1
fi

export NARRATO_DIR="${NARRATO_DIR:-$HOME/Desktop/NarratoAI}"
export GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-mpt-shorts-260727}"
export GOOGLE_CLOUD_LOCATION="${GOOGLE_CLOUD_LOCATION:-us-central1}"

bash "$SCRIPT_DIR/install.sh"

cd "$NARRATO_DIR"

if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  echo
  echo "Vertex ADC required (Startup credits). Complete browser login:"
  gcloud auth application-default login
  gcloud auth application-default set-quota-project "$GOOGLE_CLOUD_PROJECT"
fi

echo
echo "Launching NarratoAI in Chrome…"
exec ./open-chrome.sh
