#!/usr/bin/env bash
# Validate local hosting/public/app-ads.txt (IAB + AdMob publisher line).
#   bash scripts/check-app-ads-txt.sh
# Optional live smoke:
#   APP_ADS_LIVE=1 bash scripts/check-app-ads-txt.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/hosting/public/app-ads.txt"
EXPECTED='google.com, pub-4628962707131944, DIRECT, f08c47fec0942fa0'
BASE="${APP_ADS_BASE_URL:-https://cozbil-dev-f9583.web.app}"

if [[ ! -f "$FILE" ]]; then
  echo "Missing $FILE" >&2
  exit 1
fi

# No BOM; ASCII-only preferred (AdMob crawler). Exact publisher line required.
if command -v file >/dev/null 2>&1; then
  if file "$FILE" | grep -qi 'UTF-8 Unicode (with BOM)'; then
    echo "app-ads.txt must not have a UTF-8 BOM" >&2
    exit 1
  fi
fi

# Prefer single-line file matching AdMob snippet exactly (no fancy comments).
if [[ "$(wc -l < "$FILE" | tr -d ' ')" -gt 2 ]]; then
  echo "warn: prefer only the AdMob line (no multi-line comments) for crawler quirks" >&2
fi

if ! grep -qxF "$EXPECTED" "$FILE"; then
  echo "app-ads.txt missing exact AdMob authorization line:" >&2
  echo "  $EXPECTED" >&2
  exit 1
fi

# File must equal expected line (+ optional final newline) for max compatibility
normalized="$(tr -d '\r' < "$FILE" | sed '/^$/d')"
if [[ "$normalized" != "$EXPECTED" ]]; then
  echo "warn: file has extra lines beyond AdMob snippet; crawlers usually OK with # comments, but AdMob may be picky" >&2
fi

echo "✓ local app-ads.txt OK ($FILE)"

if [[ "${APP_ADS_LIVE:-0}" == "1" ]]; then
  URL="${BASE%/}/app-ads.txt"
  code="$(curl -sS -o /tmp/app-ads-live.txt -w '%{http_code}' "$URL" || true)"
  if [[ "$code" != "200" ]]; then
    echo "Live $URL → HTTP $code (deploy hosting first)" >&2
    exit 1
  fi
  ctype="$(curl -sSI "$URL" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print tolower($2); exit}')"
  if [[ "$ctype" != text/plain* ]]; then
    echo "Warn: Content-Type is '$ctype' (prefer text/plain)" >&2
  fi
  if ! grep -qxF "$EXPECTED" /tmp/app-ads-live.txt; then
    echo "Live app-ads.txt missing AdMob line" >&2
    exit 1
  fi
  echo "✓ live $URL OK"
fi
