# Sprint State

**Branch:** `cursor/scrub-google-api-key-pr31-4710` (PR #32)  
**Hedef:** Şahsi telefona demo (Mac USB veya IPA → TestFlight)

## Hazır (kod / cloud)

- [x] AdMob App ID + iOS unit ids
- [x] app-ads.txt canlı
- [x] Yeni Firebase client key (owner; repoda yok)
- [x] Version `1.0.1` / buildNumber `2`
- [x] `scripts/phone-demo-mac.sh` + `docs/qa/PHONE_DEMO_INSTALL.md`
- [ ] Cloud Linux → telefona yükleme **mümkün değil** (Xcode yok)

## Owner Mac (şimdi) — proxy off düzeltmesi

Log `solve: proxy off` ise env telefona gitmemiş demektir. Pull + proxy script:

```bash
cd ~/agent
git checkout cursor/scrub-google-api-key-pr31-4710 && git pull

bash scripts/write-vision-api-key-local.sh   # bir kez
bash scripts/phone-demo-proxy-mac.sh         # .env.local + solveProxy.dev.local.ts
bash scripts/check-phone-demo-env.sh         # FAIL yoksa devam

# Metro Ctrl+C → yeniden:
bash scripts/phone-dev-build.sh metro
# Beklenen log: solve: bounded OCR proxy { base: 'http://192.168.x.x:8787' }
```

USB native (ATS / ilk kurulum): `bash scripts/phone-demo-mac.sh ios`  
Canlı backend: `bash scripts/phone-demo-mac.sh fix-backend` (ping 200)

**Kullanma:** App Store build 17 (ölü Firebase key).

## Sonra

- [ ] Telefonda smoke (LGS/YGS/KPSS/Ehliyet + fixture)
- [ ] GitHub secret alert → Revoked
- [ ] AdMob app-ads doğrulama yenile
- [ ] GH secret `EXPO_PUBLIC_FIREBASE_API_KEY` → yeni key (Actions için)
