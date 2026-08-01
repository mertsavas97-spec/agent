#!/usr/bin/env bash
# Phone demo env sağlık kontrolü (secret dump yok).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="$ROOT/apps/mobile/.env.local"
PROXY_TS="$ROOT/apps/mobile/src/config/solveProxy.dev.local.ts"
ok=0
warn=0
fail=0

pass() { echo "  OK  $*"; ok=$((ok + 1)); }
soft() { echo "  WARN $*"; warn=$((warn + 1)); }
hard() { echo "  FAIL $*"; fail=$((fail + 1)); }

echo "== ÇözBil phone demo env =="

if [[ -f "$ENV_LOCAL" ]]; then
  pass ".env.local var"
else
  hard ".env.local yok — write-mobile-env-local.sh + phone-demo-proxy-mac.sh"
fi

has_key() {
  local k="$1"
  [[ -f "$ENV_LOCAL" ]] || return 1
  grep -qE "^${k}=.+" "$ENV_LOCAL" 2>/dev/null
}

if has_key EXPO_PUBLIC_FIREBASE_API_KEY; then
  pass "Firebase API key dolu"
else
  soft "Firebase API key boş (anonim auth / REST upload için gerekebilir)"
fi

if has_key EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY; then
  soft "Vision key .env.local'de (yalnız Mac proxy; telefona gerekmez)"
fi

if [[ -f "$PROXY_TS" ]]; then
  if grep -q "url: \"http" "$PROXY_TS" && ! grep -q 'token: ""' "$PROXY_TS"; then
    pass "solveProxy.dev.local.ts dolu (Metro bundle yedek)"
  else
    soft "solveProxy.dev.local.ts boş — LAN Metro hostUri ile auto (yine de phone-demo-proxy-mac.sh şart)"
  fi
else
  soft "solveProxy.dev.local.ts yok (scaffold eksik olabilir)"
fi

if has_key EXPO_PUBLIC_SOLVE_PROXY_URL && has_key EXPO_PUBLIC_SOLVE_PROXY_TOKEN; then
  pass ".env.local proxy satırları da var (yedek)"
else
  soft ".env.local proxy satırları yok (dev.local.ts doluysa sorun değil)"
fi

echo
echo "Özet: ok=$ok warn=$warn fail=$fail"
if [[ "$fail" -gt 0 ]]; then
  echo "Sonraki: bash scripts/phone-demo-proxy-mac.sh && Ctrl+C Metro && bash scripts/phone-dev-build.sh metro"
  exit 1
fi
echo "Metro restart sonrası log: solve: bounded OCR proxy"
exit 0
