# Sprint 2 Plan — IAP + Server Entitlement

**Goal:** Prod local premium bypass kapalı; purchase → syncSubscription → Firestore.

**Agents/skills:** Koordinatör · architect · executor · security-reviewer · qa-tester  
Skills: `expo-iap` (Expo Play Billing path) · `senior-fullstack` · `cozbil-expo-mobile` · `paywalls` · `ship-gate`

## Tasks

1. Functions: `verifyPlayPurchase` adapter + `syncSubscription` persistence + callable export
2. Mobile: gate `activateLocalPremium`; `billing.ts` + `syncSubscriptionClient.ts`; wire premium/solve
3. Tests + docs (quickstart, checklist, sprint report with agent/skill bullets)
