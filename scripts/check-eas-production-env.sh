#!/usr/bin/env bash
# Document + verify production EAS public env pattern (no secrets printed).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EAS_JSON="${ROOT}/apps/mobile/eas.json"

if [[ ! -f "$EAS_JSON" ]]; then
  echo "check-eas-production-env: missing $EAS_JSON" >&2
  exit 1
fi

EAS_JSON="$EAS_JSON" node <<'NODE'
const eas = require(process.env.EAS_JSON);
const env = eas.build?.production?.env ?? {};
const requiredInJson = [
  'EXPO_PUBLIC_PRIVACY_POLICY_URL',
  'EXPO_PUBLIC_TERMS_URL',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
  'EXPO_PUBLIC_ADS_STUB',
  'EXPO_PUBLIC_PREMIUM_SANDBOX',
];
const forbidden = [
  'EXPO_PUBLIC_SOLVE_PROXY_URL',
  'EXPO_PUBLIC_SOLVE_PROXY_TOKEN',
];
let fail = false;
for (const k of requiredInJson) {
  if (env[k] === undefined || env[k] === '') {
    console.error(`check-eas-production-env: FAIL — production.env missing ${k}`);
    fail = true;
  }
}
for (const k of forbidden) {
  if (Object.prototype.hasOwnProperty.call(env, k)) {
    console.error(`check-eas-production-env: FAIL — production.env must not set ${k}`);
    fail = true;
  }
}
if (env.EXPO_PUBLIC_ADS_STUB !== '0') {
  console.error('check-eas-production-env: FAIL — EXPO_PUBLIC_ADS_STUB must be "0" in production');
  fail = true;
}
if (env.EXPO_PUBLIC_PREMIUM_SANDBOX !== '0') {
  console.error('check-eas-production-env: FAIL — EXPO_PUBLIC_PREMIUM_SANDBOX must be "0" in production');
  fail = true;
}
if (fail) process.exit(1);

console.log('check-eas-production-env: OK — eas.json production env hygiene');
console.log('');
console.log('Owner must also set Firebase public keys as EAS secrets / env (not committed):');
console.log('  eas env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --environment production --value <from Firebase Console>');
console.log('  eas env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --environment production --value <from Firebase Console>');
console.log('Optional AdMob (when live SDK ships):');
console.log('  EXPO_PUBLIC_ADMOB_* unit ids via EAS env — never commit real prod ids');
NODE
