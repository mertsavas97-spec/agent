# Sprint State

**Branch:** `cursor/scrub-google-api-key-pr31-4710` (PR #32)  
**Sprint:** AdMob iOS units + Firebase key scrub; owner rotate

## Security (PR #31 leak)

- [x] PR #31 closed (body history contaminated)
- [x] Clean PR #32 opened (placeholders only)
- [x] Repo tree: no `AIza…`
- [x] `.github/PULL_REQUEST_TEMPLATE.md` (no secrets in PR text)
- [ ] Owner: **new** Browser key in GCP `cozbil-dev-f9583` → Cursor/EAS secrets → new IPA → **then** delete old key → GitHub alert **Revoked**

## AdMob iOS (in PR #32)

- [x] App ID `~6347757786`
- [x] Banner / Interstitial / Rewarded unit ids in `eas.json`
- [ ] Owner: Mac IPA from **this** branch after secrets updated

```bash
git checkout cursor/scrub-google-api-key-pr31-4710 && git pull
# export EXPO_PUBLIC_FIREBASE_* from secrets (never paste into chat/PR)
bash scripts/mac-build-ipa-with-push.sh
```

## Hosting / app-ads.txt

- [x] Live: `https://cozbil-dev-f9583.web.app/app-ads.txt` (200)
- [ ] Owner: AdMob “güncellemeleri kontrol et” / doğrulama
