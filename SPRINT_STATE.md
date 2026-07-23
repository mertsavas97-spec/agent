# Sprint State

**Branch:** `cursor/ios-local-ipa-2914`  
**Sprint:** iOS production IPA path (Mac local + GHA macOS)

## iOS IPA

- [x] `appleTeamId` = `J46LLRJA44`
- [x] `ITSAppUsesNonExemptEncryption: false`
- [x] GHA `ios-production-ipa.yml` (macos-14, eas --local)
- [x] `scripts/build-ios-ipa-local.sh`
- [ ] Owner: ASC app + `ascAppId` + IAP + EAS iOS credentials
- [ ] Owner: Run **iOS production IPA** on Actions (or Mac script)
- [ ] Agent note: Linux cloud host cannot produce IPA (no Xcode)

## Android (önceki)

- [x] GHA AAB + Play SKUs owner path
