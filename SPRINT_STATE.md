# Sprint State

**Aktif çalışma yeri:** Cloud agent  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**Sprint:** **4 + store agent closeout + AdMob + owner preflight helpers**

## Store P0 (listing görselleri hariç)

- [x] Stub reklam gizle (`isLiveAdsDeliveryReady` / unavailable engine)
- [x] `expo-image-picker` plugin + Android permissions
- [x] IAP `credentials_missing` dürüst UX
- [x] Public `/terms` artefact + `termsUrl` + EAS env
- [x] EAS Firebase fail-fast + `check-eas-*.sh`
- [x] Production solve proxy guard tests

## Store P1

- [x] `grantRewardedSolve` callable + client
- [x] Account hard purge (`purgeAccount`)
- [x] Entitlement hydrate from `users/{uid}`
- [x] CI workflow (typecheck + jest)
- [x] POST_NOTIFICATIONS + privacy/local-push copy hizası

## Rewarded policy

- [x] Günlük max kaldırıldı (+1 ve çoklu unlock)
- [x] Her çoklu açılışta reklam → unlock + `grantRewardedSolve`
- [x] Saatlik abuse rate-limit (40/saat)

## Store P2

- [x] Analytics event wrapper
- [x] In-app review (`expo-store-review`)
- [x] StoreKit verify stub (`verifyAppStorePurchase` + platform=ios)
- [x] ESLint (`eslint-config-expo`, lint app/src) — 0 warning
- [x] `supportsTablet: false` (phone-first)
- [x] AdMob SDK scaffold (`react-native-google-mobile-ads` + `adMobEngine`)
- [x] Owner ops runbook (`docs/store/OWNER_OPS_STORE_READY.md`)
- [x] Owner preflight + deploy helpers (`check-store-preflight`, `deploy-store-functions`, `deploy-hosting-legal`)
- [x] Hosting `/terms` rewrite + root index linkleri
- [ ] Owner: Functions deploy (grant + purge + sync ios path)
- [ ] Owner: `eas init` (owner/projectId)
- [ ] Owner: hosting deploy (privacy + terms)
- [ ] Owner: Play SKU + billing credentials
- [ ] Owner: AdMob **production** unit ids (+ child-directed console)
- [ ] Owner: iOS App Store Server API full verify

## Sprint 3 residual

- [x] `.env` + privacy/support/terms env örnekleri
- [x] Firebase Hosting klasörü (`hosting/public/privacy` + `terms`)
- [x] Data Safety draft
- [x] Hosting deploy **runbook** (`docs/store/hosting-deploy-runbook.md`)
- [ ] Hosting deploy — **firebase login --reauth** (owner; agent auth yok)
- [ ] Counsel imzası — insan/avukat

## Sprint 4

- [x] `eas.json` production: AAB/store, privacy + terms URL env
- [x] `app.config.js` — production’da expo-dev-client strip + Firebase fail-fast + AdMob plugin
- [x] Listing / ASO drafts
- [ ] Owner: `eas init` + `eas build/submit`

## Beklenen legal URL’ler

- `https://cozbil-dev-f9583.web.app/privacy`
- `https://cozbil-dev-f9583.web.app/terms`
