# Sprint State

**Branch:** `cursor/scrub-google-api-key-pr31-4710` (PR #32)  
**Hedef:** Local Mac IPA — Cursor/EAS secrets şart değil

## Hazır (kod)

- [x] AdMob App ID `~6347757786`
- [x] Banner / Interstitial / Rewarded iOS unit ids (`eas.json` + script)
- [x] Inactive-push fix (bu branch’te)
- [x] app-ads.txt canlı (`cozbil-dev-f9583.web.app/app-ads.txt`)
- [x] Yeni GCP API key oluşturuldu (owner Mac)
- [x] Firebase key **repoda yok** (doğru) — Mac `.env.local` ile build’e girer

## Owner Mac (Cursor yok)

```bash
cd ~/agent
git checkout cursor/scrub-google-api-key-pr31-4710 && git pull

# bir kez: apps/mobile/.env.local  (commit etme)
# EXPO_PUBLIC_FIREBASE_API_KEY=…   # get-key-string çıktısı
# EXPO_PUBLIC_FIREBASE_APP_ID=1:717206185063:web:74256b15d50acb5c49a0c2

bash scripts/mac-build-ipa-with-push.sh
# → ~/Desktop/cozbil-production.ipa
```

## Sonra

- [ ] Eski sızan Firebase key’i GCP’den sil
- [ ] GitHub secret alert → Revoked
- [ ] AdMob doğrulama yenile
