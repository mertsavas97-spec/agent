#!/usr/bin/env bash
# Owner Sprint A preflight — repo + artefact checks (no secrets printed).
# Exit 0 = agent-side gate OK (owner console steps may still remain).
# Exit 1 = something in-repo still broken before eas/firebase login.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pass=0
warn=0
fail=0

ok()   { echo "  OK  $*"; pass=$((pass + 1)); }
warn() { echo "  WARN $*"; warn=$((warn + 1)); }
bad()  { echo "  FAIL $*"; fail=$((fail + 1)); }

echo "==> Store preflight (agent artefacts)"
echo ""

# --- Legal hosting artefacts ---
echo "[legal]"
for path in hosting/public/privacy/index.html hosting/public/terms/index.html; do
  if [[ -f "$path" ]]; then
    ok "$path"
  else
    bad "missing $path"
  fi
done
if grep -q '"/terms"' firebase.json 2>/dev/null; then
  ok "firebase.json rewrite /terms"
else
  bad "firebase.json missing /terms rewrite"
fi

# --- EAS hygiene (committed env only) ---
echo ""
echo "[eas]"
if bash scripts/check-eas-production-env.sh >/dev/null; then
  ok "eas.json production env hygiene"
else
  bad "eas.json production env hygiene"
fi
if bash scripts/check-eas-project.sh >/dev/null 2>&1; then
  ok "eas owner/projectId filled"
else
  warn "eas owner/projectId empty — owner: cd apps/mobile && eas init"
fi

# --- Mobile / AdMob scaffold ---
echo ""
echo "[mobile]"
if [[ -f apps/mobile/src/features/ads/adMobEngine.ts ]]; then
  ok "adMobEngine present"
else
  bad "adMobEngine missing"
fi
if grep -q 'react-native-google-mobile-ads' apps/mobile/package.json; then
  ok "react-native-google-mobile-ads dependency"
else
  bad "AdMob dependency missing"
fi
if grep -q 'supportsTablet.: false\|"supportsTablet": false' apps/mobile/app.json apps/mobile/app.config.js 2>/dev/null \
  || node -e "const j=require('./apps/mobile/app.json'); process.exit(j.expo?.ios?.supportsTablet===false?0:1)"; then
  ok "ios.supportsTablet=false"
else
  warn "supportsTablet not false (check app.json)"
fi

# --- Functions exports ---
echo ""
echo "[functions]"
for name in grantRewardedSolve purgeAccount syncSubscription; do
  if grep -q "export const ${name}" functions/src/index.ts; then
    ok "export ${name}"
  else
    bad "missing export ${name}"
  fi
done
if grep -q 'verifyAppStorePurchase\|ios_not_implemented' functions/src/subscription/*.ts 2>/dev/null; then
  ok "StoreKit path stub present"
else
  warn "StoreKit stub not found (iOS later)"
fi

# --- CI ---
echo ""
echo "[ci]"
if [[ -f .github/workflows/ci.yml ]]; then
  ok ".github/workflows/ci.yml"
else
  bad "CI workflow missing"
fi

# --- Docs ---
echo ""
echo "[docs]"
for path in docs/store/OWNER_OPS_STORE_READY.md docs/store/hosting-deploy-runbook.md; do
  if [[ -f "$path" ]]; then
    ok "$path"
  else
    bad "missing $path"
  fi
done

echo ""
echo "==> Summary: pass=${pass} warn=${warn} fail=${fail}"
echo ""
echo "Owner still must (not checked here):"
echo "  1. eas login + eas init + Firebase/EAS secrets"
echo "  2. bash scripts/deploy-store-functions.sh   # after firebase login"
echo "  3. bash scripts/deploy-hosting-legal.sh     # privacy + terms"
echo "  4. Play Console SKUs + GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"
echo "  5. Prod solve smoke (no proxy) + listing screenshots"
echo "  See: docs/store/OWNER_OPS_STORE_READY.md"

if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
exit 0
