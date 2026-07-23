#!/usr/bin/env bash
# Fail if Expo EAS projectId / owner are still empty placeholders.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_JSON="${ROOT}/apps/mobile/app.json"

if [[ ! -f "$APP_JSON" ]]; then
  echo "check-eas-project: missing $APP_JSON" >&2
  exit 1
fi

OWNER="$(node -e "const j=require('$APP_JSON'); process.stdout.write(String(j.expo?.owner ?? '').trim())")"
PROJECT_ID="$(node -e "const j=require('$APP_JSON'); process.stdout.write(String(j.expo?.extra?.eas?.projectId ?? '').trim())")"

ok=1
if [[ -z "$OWNER" ]]; then
  echo "check-eas-project: FAIL — expo.owner is empty (run: cd apps/mobile && eas init)" >&2
  ok=0
fi
if [[ -z "$PROJECT_ID" ]]; then
  echo "check-eas-project: FAIL — expo.extra.eas.projectId is empty (run: cd apps/mobile && eas init)" >&2
  ok=0
fi

if [[ "$ok" -ne 1 ]]; then
  exit 1
fi

echo "check-eas-project: OK — owner=${OWNER} projectId=${PROJECT_ID}"
