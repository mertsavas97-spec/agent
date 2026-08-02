#!/usr/bin/env bash
# DEPRECATED path for dogfood: Cloud Console API keys → API_KEY_INVALID on
# generativelanguage.googleapis.com (org policy / product mismatch).
#
# Prefer Vertex (Startup billing):
#   bash scripts/write-vertex-solve-local.sh
#
# Optional: AI Studio key only (separate wallet) → set GEMINI_API_KEY manually
#   https://aistudio.google.com/apikey
#   apps/mobile/.env.local → GEMINI_API_KEY=AIza…  and COZBIL_USE_VERTEX=0

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> GCP API key ile Generative Language bu projede çalışmıyor (API_KEY_INVALID)."
echo "==> Vertex AI yoluna geçiliyor…"
echo ""
exec bash "$ROOT/scripts/write-vertex-solve-local.sh"
