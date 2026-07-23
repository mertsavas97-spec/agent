# Sprint State

**Aktif çalışma yeri:** Cloud agent  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**Sprint:** **Play Photo/Video permissions (Photo Picker) + owner store ops**

## Play Photo & Video policy (bu tur)

- [x] Remove `READ_MEDIA_IMAGES` / block READ_MEDIA_* in `app.json`
- [x] Android gallery skips media-library permission (Photo Picker)
- [x] Owner runbook `docs/store/PLAY_PHOTO_VIDEO_PERMISSIONS.md`
- [ ] Owner: production AAB rebuild + Internal upload (eski AAB izni temizlemek için)

## Dogfood / Metro

- [x] Soft-load StoreReview / push / haptics / image-picker
- [ ] Owner: full app kill + Metro reload
- [ ] Owner (önerilen): yeni **development** profile build

## Store P0–P2 (Android agent)

- [x] P0–P2 agent closeout
- [x] Production Android AAB (önceki; **izin fix sonrası yeniden build gerekir**)
- [ ] Owner: Play Console app + submit + SKU + billing secret
- [ ] Owner: Org policy invoker (callables)

## iOS prep

- [x] StoreKit live verify + docs
- [ ] Owner: ASC / secrets / REPLACE_* / TestFlight

## Legal

- [x] Hosting privacy + terms deployed
- [ ] Counsel imzası

## Beklenen legal URL’ler

- `https://cozbil-dev-f9583.web.app/privacy`
- `https://cozbil-dev-f9583.web.app/terms`
