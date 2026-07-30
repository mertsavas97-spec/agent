# Sprint State

**Branch:** `cursor/inactive-push-weekly-2914`  
**Sprint:** Inactive push fix → Mac local IPA (store)

## Push (PR #29)

- [x] Never-solved: haftada en fazla 1 nazik davet (`inactiveWeekly`)
- [x] İlk çözüm sonrası: full schedule (`refreshLocalPushAfterSolve`)
- [x] QA: typecheck / lint / localPush + localHistoryStore PASS
- [ ] Merge → `main` (owner veya merge sonrası)

## IPA (bu ortamda BLOK)

Cloud agent = **Linux**, Xcode yok → burada IPA **üretilmez**.  
Owner Mac (önceki başarılı yol):

```bash
cd ~/agent   # repo
export EXPO_PUBLIC_FIREBASE_API_KEY=...
export EXPO_PUBLIC_FIREBASE_APP_ID=...
bash scripts/mac-build-ipa-with-push.sh
# → ~/Desktop/cozbil-production.ipa
```

Alternatif: Actions → **iOS production IPA** → branch `cursor/inactive-push-weekly-2914`.

## AdMob / Hosting (paralel, PR #30)

- [ ] Owner: `bash scripts/deploy-hosting-legal.sh`
- [ ] ASC developer website = `https://cozbil-dev-f9583.web.app`
