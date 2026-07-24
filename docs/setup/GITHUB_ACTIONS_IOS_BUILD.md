# iOS production IPA — local (Mac) veya GitHub Actions

Cloud agent / Linux’ta IPA **üretilmez** (Xcode gerekir).

## A) GitHub Actions (önerilen — Mac disk yok)

1. Bu workflow `main`’de olsun (PR merge).  
2. Secrets (Android ile aynı): `EXPO_TOKEN`, Firebase public key’ler.  
3. Expo’da iOS credentials hazır olsun:  
   `cd apps/mobile && eas credentials -p ios`  
4. Actions → **iOS production IPA** → Run (`main`)  
5. Artifact: `cozbil-ios-production-ipa` → TestFlight’a `eas submit` veya Transporter  

Workflow: `.github/workflows/ios-production-ipa.yml`  
Not: macOS runner dakikası Ubuntu’dan pahalıdır (GitHub kotası).

## B) Kendi Mac’in

```bash
cd ~/agent
git checkout main && git pull
export EXPO_PUBLIC_FIREBASE_API_KEY='...'
export EXPO_PUBLIC_FIREBASE_APP_ID='...'
# disk: Avail ≥ 25Gi; EAS_LOCAL_BUILD_WORKINGDIR=$HOME/eas-local-build
bash scripts/build-ios-ipa-local.sh
```

## EAS submit alanları

| Alan | Değer |
|------|--------|
| `appleTeamId` | `J46LLRJA44` (repoda set) |
| `ascAppId` | ASC App Information → Apple ID (sayı) — hâlâ `REPLACE_*` ise submit öncesi doldur |

## Önkoşul checklist

- [x] Bundle ID `com.cozbil.app` (Apple Identifier mevcut)
- [ ] ASC’de app kaydı
- [ ] 3 IAP product id
- [ ] EAS iOS distribution credentials
- [ ] `ascAppId` (submit için)
- [ ] Functions Apple API secrets (satın alma verify — TestFlight smoke’tan önce önerilir)
