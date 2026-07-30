# Sprint State

**Branch:** `cursor/app-ads-txt-admob-2914`  
**Sprint:** AdMob app-ads.txt doğrulama + reklam unit wiring kontrolü

## AdMob / Hosting

- [x] `hosting/public/app-ads.txt` (`pub-4628962707131944`)
- [x] `firebase.json` Content-Type `text/plain` for `/app-ads.txt`
- [x] Deploy script + `scripts/check-app-ads-txt.sh`
- [x] Banner / interstitial / rewarded kod yolu doğrulandı (EAS `EXPO_PUBLIC_ADMOB_*` owner)
- [ ] Owner: `bash scripts/deploy-hosting-legal.sh` (Firebase login)
- [ ] Owner: ASC/Play developer website = `https://cozbil-dev-f9583.web.app`
- [ ] Owner: AdMob “güncellemeleri kontrol et”
- [ ] Owner: EAS production secrets for real AdMob app/unit ids

## iOS IPA (önceki)

- [x] `appleTeamId` = `J46LLRJA44`
- [x] `ascAppId` = `6794124806`
- [x] Owner: local production IPA
- [ ] Owner: `eas submit` → TestFlight
- [ ] Owner: ASC IAP + Apple API secrets (`APPLE_*`)
