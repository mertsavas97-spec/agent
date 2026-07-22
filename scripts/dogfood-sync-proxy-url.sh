#!/usr/bin/env bash
# Sync EXPO_PUBLIC_SOLVE_PROXY_URL from the live localhost.run proxy tunnel log.
# Does not commit .env (gitignored). Restart Metro after running.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/mobile/.env"
LOG="${COZBIL_PROXY_LHR_LOG:-/tmp/cozbil-proxy-lhr.log}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "missing $ENV_FILE" >&2
  exit 1
fi
if [[ ! -f "$LOG" ]]; then
  echo "missing proxy tunnel log: $LOG" >&2
  exit 1
fi

URL="$(grep -Eo 'https://[a-z0-9]+\.lhr\.life' "$LOG" | tail -1 || true)"
if [[ -z "$URL" ]]; then
  echo "no lhr.life URL found in $LOG" >&2
  exit 1
fi

if ! curl -fsS -m 8 -H 'Bypass-Tunnel-Reminder: 1' "$URL/health" | grep -q cozbil-solve-proxy; then
  echo "proxy tunnel unhealthy: $URL" >&2
  exit 1
fi

if grep -q '^EXPO_PUBLIC_SOLVE_PROXY_URL=' "$ENV_FILE"; then
  sed -i "s|^EXPO_PUBLIC_SOLVE_PROXY_URL=.*|EXPO_PUBLIC_SOLVE_PROXY_URL=${URL}|" "$ENV_FILE"
else
  echo "EXPO_PUBLIC_SOLVE_PROXY_URL=${URL}" >>"$ENV_FILE"
fi
echo "$URL" > /tmp/cozbil-proxy-url.txt
echo "synced EXPO_PUBLIC_SOLVE_PROXY_URL=${URL}"
echo "Restart Metro so the app picks up the new EXPO_PUBLIC_ value."
