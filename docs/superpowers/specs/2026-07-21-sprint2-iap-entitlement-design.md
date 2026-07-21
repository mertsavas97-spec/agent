# Sprint 2 — IAP + Server Entitlement

**Date:** 2026-07-21  
**Status:** Approved (owner: approach 1)  
**Branch:** `cursor/mvp-10-launch-audit-9131`

## Decisions

- Billing: **expo-iap** (Expo OpenIAP — same architecture as react-native-iap path) + Firebase callable **`syncSubscription`**
- Verify: Google Play Developer API when credentials present; never elevate without verified token (except explicit sandbox / `__DEV__` local)
- Local `activateLocalPremium`: **only** `__DEV__` or `EXPO_PUBLIC_PREMIUM_SANDBOX=1`

## Agents / skills (this sprint)

- **Koordinatör** — orchestration, QA Gate, report
- **architect** — entitlement SSoT (Firestore `subscriptionStatus`)
- **executor** — mobile billing + Functions callable
- **security-reviewer** lens — no prod local bypass; no secrets in repo
- **qa-tester** — unit tests + smoke
- Skills: `cozbil-expo-mobile`, `senior-fullstack`, `paywalls`, Context7 (IAP/Play API as needed), `ship-gate`

## Out of scope

- Play Console product creation (owner)
- Committing service account JSON
- Full StoreKit polish
