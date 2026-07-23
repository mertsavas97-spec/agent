# Sprint report — iOS StoreKit live verify

**Tarih:** 2026-07-23  
**Branch:** `cursor/solve-word-eq-proxy-6767`

## Yapılanlar

1. `verifyAppStorePurchase` — App Store Server API `getTransactionInfo` (JWT ES256, Production→Sandbox)
2. Client: iOS purchase proof `purchaseToken` / `transactionId` / `id` / JWS
3. `eas.json` production iOS `resourceClass`
4. `docs/store/OWNER_OPS_IOS.md` + iap/EAS docs güncellemesi

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** Mobile, Architect, QA, Guardian  
**Skill/agent setleri:** cozbil-team-skills, cozbil-expo-mobile, cozbil-guardian  
**Skill bypass:** Context7 (Apple Server API docs via web)  
**QA Gate:**
- typecheck: PASS (mobile + functions)
- lint: PASS
- smoke: functions verifyAppStore + syncSubscription; billingFailureMessage
- guardian: PASS (no fake Premium elevate)

**Sonraki:** Owner ASC + Apple API secrets + `eas build --platform ios`
