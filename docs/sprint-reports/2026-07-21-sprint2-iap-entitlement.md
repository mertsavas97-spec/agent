# Sprint Raporu — 2026-07-21 (Sprint 2 IAP + Entitlement)

## Sprint Agent Raporu

**Koordinatör:** Wave A2  
**Durum:** Kod yolu tamam; Play Console ürünleri + service account **owner**

### Agent / skill set (mini)
- **Koordinatör** — plan, gate, rapor
- **architect** — Firestore `subscriptionStatus` SSoT
- **executor** — `expo-iap` billing + Functions callable
- **security-reviewer** (lens) — prod local bypass kapalı; secret yok
- **qa-tester** — unit tests
- Skills: `cozbil-expo-mobile` · `senior-fullstack` · `paywalls` · `ship-gate` · expo-iap docs

### Yapılanlar
- `activateLocalPremium` → yalnız `__DEV__` / `EXPO_PUBLIC_PREMIUM_SANDBOX`
- `billing.ts` + `syncSubscriptionClient.ts` + `premium`/`solve` wire
- Callable `syncSubscription` + `verifyPlayPurchase` (googleapis)
- `COZBIL_BILLING_SANDBOX=1` sunucu sandbox
- quickstart + Play checklist güncellendi

### QA Gate
- functions `syncSubscription*` tests: **PASS** (8)
- mobile entitlement/paywall/pricing: **PASS** (8)
- functions typecheck: **PASS**
- mobile typecheck: **FAIL (pre-existing)** typedRoutes path drift — Sprint 2’ye özel yeni hata değil
- guardian: PASS — prod local elevate yok

### Owner kalan
- Play Console SKU + license testers
- `PLAY_PACKAGE_NAME` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- Dev client rebuild (`expo-iap` native)

**Sonraki:** Sprint 3 — KVKK / privacy URL + guardian UX
