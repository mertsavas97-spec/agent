#!/usr/bin/env bash
# Mac: phone demo env sağlık kontrolü (secret değerleri yazdırmaz)
#
#   bash scripts/check-phone-demo-env.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"

flag() {
  local file="$1" key="$2"
  if [[ -f "$file" ]] && grep -qE "^${key}=.+" "$file"; then
    echo "  OK  $key  ($file)"
  else
    echo "  MISSING  $key  ($file)"
  fi
}

echo "==> $MOBILE/.env.local"
flag "$MOBILE/.env.local" "EXPO_PUBLIC_FIREBASE_API_KEY"
flag "$MOBILE/.env.local" "EXPO_PUBLIC_SOLVE_PROXY_URL"
flag "$MOBILE/.env.local" "EXPO_PUBLIC_SOLVE_PROXY_TOKEN"
flag "$MOBILE/.env.local" "GOOGLE_CLOUD_VISION_API_KEY"

echo "==> $MOBILE/.env"
flag "$MOBILE/.env" "EXPO_PUBLIC_FIREBASE_API_KEY"
flag "$MOBILE/.env" "EXPO_PUBLIC_SOLVE_PROXY_URL"
flag "$MOBILE/.env" "EXPO_PUBLIC_SOLVE_PROXY_TOKEN"

if [[ -f "$MOBILE/.env.local" ]]; then
  url="$(grep -E '^EXPO_PUBLIC_SOLVE_PROXY_URL=' "$MOBILE/.env.local" | head -1 | cut -d= -f2- || true)"
  if [[ -n "$url" ]]; then
    echo "==> proxy health: $url/health"
    if curl -fsS -m 5 "${url}/health" 2>/dev/null | grep -q cozbil-solve-proxy; then
      echo "  OK  proxy ayakta"
    else
      echo "  FAIL  proxy yanıt vermiyor — bash scripts/phone-demo-proxy-mac.sh"
    fi
  fi
fi

echo ""
echo "Proxy satırları yoksa:"
echo "  bash scripts/phone-demo-proxy-mac.sh"
echo "Sonra Metro’yu yeniden başlat (Ctrl+C → bash scripts/phone-dev-build.sh metro)"
