# Sprint State

**Aktif çalışma yeri:** Cloud agent  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**Sprint:** **iOS store prep (StoreKit live verify) + Android owner ops parallel**

## Store P0–P2 (Android agent)

- [x] P0–P2 agent closeout (ads, IAP UX, terms, CI, review, ESLint, AdMob pin 16.0.0)
- [x] Production Android AAB (owner build OK)
- [ ] Owner: Play Console app + submit + SKU + billing secret
- [ ] Owner: Org policy invoker (callables)

## iOS prep (bu sprint)

- [x] `verifyAppStorePurchase` → App Store Server API live client
- [x] Client purchase proof: purchaseToken / transactionId / JWS
- [x] `eas.json` production iOS resourceClass
- [x] `docs/store/OWNER_OPS_IOS.md`
- [ ] Owner: ASC app + IAP products
- [ ] Owner: Apple API key Functions secrets
- [ ] Owner: `eas.json` ascAppId / appleTeamId
- [ ] Owner: `eas build/submit` iOS → TestFlight

## Legal

- [x] Hosting privacy + terms deployed
- [ ] Counsel imzası

## Beklenen legal URL’ler

- `https://cozbil-dev-f9583.web.app/privacy`
- `https://cozbil-dev-f9583.web.app/terms`
