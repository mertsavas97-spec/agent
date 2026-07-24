# Sprint State

**Branch:** `cursor/openiap-xcode-compat-2914`  
**Sprint:** iOS production IPA — OpenIAP / Xcode 26.4 StoreKit compat

## iOS IPA

- [x] `appleTeamId` = `J46LLRJA44`
- [x] `ITSAppUsesNonExemptEncryption: false`
- [x] Static `aps-environment` + Push credential sync path
- [x] GHA `ios-production-ipa.yml` + local Mac script
- [x] OpenIAP Xcode 26.4 StoreKit billing-plan compile guard (`withOpenIapXcodeCompat`)
- [ ] Owner: `rm -rf ios` + `eas build --local` (or Xcode 26.5+) → IPA
- [ ] Owner: ASC `ascAppId` + IAP + Apple API secrets
- [ ] Agent note: Linux cloud host cannot produce IPA (no Xcode)

## Android (önceki)

- [x] GHA AAB + Play SKUs owner path
