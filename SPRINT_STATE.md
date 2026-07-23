# Sprint State

**Aktif çalışma yeri:** Cloud agent  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**Sprint:** **4 + store P0 impl** — ads hide / permissions / IAP UX / terms / EAS guards

## Store P0 (bu tur — listing görselleri hariç)

- [x] Stub reklam gizle (`isLiveAdsDeliveryReady` / unavailable engine)
- [x] `expo-image-picker` plugin + Android permissions
- [x] IAP `credentials_missing` dürüst UX
- [x] Public `/terms` artefact + `termsUrl` + EAS env
- [x] EAS Firebase fail-fast + `check-eas-*.sh`
- [x] Production solve proxy guard tests
- [ ] Owner: `eas init` (owner/projectId)
- [ ] Owner: hosting deploy (privacy + terms)
- [ ] Owner: Play SKU + billing credentials
- [ ] Owner: AdMob native SDK + store products
- [ ] Owner: iOS App Store purchase verify

## Sprint 3 residual

- [x] `.env` + privacy/support/terms env örnekleri
- [x] Firebase Hosting klasörü (`hosting/public/privacy` + `terms`)
- [x] Data Safety draft
- [x] Hosting deploy **runbook** (`docs/store/hosting-deploy-runbook.md`)
- [ ] Hosting deploy — **firebase login --reauth** (owner; agent auth yok)
- [ ] Counsel imzası — insan/avukat

## Sprint 4

- [x] `eas.json` production: AAB/store, privacy + terms URL env
- [x] `app.config.js` — production’da expo-dev-client strip + Firebase fail-fast
- [x] Listing / ASO drafts
- [ ] Owner: `eas init` + `eas build/submit`

## Beklenen legal URL’ler

- `https://cozbil-dev-f9583.web.app/privacy`
- `https://cozbil-dev-f9583.web.app/terms`
