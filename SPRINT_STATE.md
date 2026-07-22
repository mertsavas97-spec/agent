# Sprint State

**Aktif çalışma yeri:** Cloud agent  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**Sprint:** **4 başladı** — EAS + listing/ASO prep (credential’lı adımlar owner)

## Sprint 3 residual

- [x] `.env` + privacy/support env örnekleri
- [x] Firebase Hosting klasörü (`hosting/public/privacy`)
- [x] Data Safety draft
- [x] Hosting deploy **runbook** (`docs/store/hosting-deploy-runbook.md`)
- [ ] Hosting deploy — **firebase login --reauth** (owner; agent auth yok)
- [ ] Counsel imzası — insan/avukat

## Sprint 4 (bu tur)

- [x] `eas.json` production: AAB/store, no proxy, privacy URL env
- [x] `app.config.js` — production’da expo-dev-client strip
- [x] `docs/setup/EAS_PRODUCTION.md`
- [x] Listing full copy + ASO keyword map + content rating draft
- [ ] Owner: `eas init` (owner + projectId)
- [ ] Owner: hosting deploy + Play screenshots / feature graphic
- [ ] Owner: `eas build/submit` production

## Beklenen privacy URL

`https://cozbil-dev-f9583.web.app/privacy`

## Sonraki (owner veya “devam”)

1. `firebase login --reauth` → hosting deploy  
2. `eas init` + Firebase public keys secrets → `eas build --profile production`  
3. Play screenshots / feature graphic  
4. Counsel final privacy metni
