# iOS production IPA — local (Mac) veya GitHub Actions

Cloud agent / Linux’ta IPA **üretilmez** (Xcode gerekir).

## Önce bir kez (zorunlu) — CI hatası budur

Actions log’undaki:

`Distribution Certificate is not validated for non-interactive builds`  
`Credentials are not set up`

Anlamı: Expo’da iOS **Distribution Certificate + Provisioning Profile** henüz kurulmamış.  
CI `--non-interactive` olduğu için Apple’a soru soramaz.

### Mac’te bir kez (interaktif)

```bash
cd ~/agent/apps/mobile
git checkout main && git pull
eas login
eas credentials -p ios
# All → Set up / Build Credentials → Let Expo handle / Generate new
# Apple ID ile giriş → Team J46LLRJA44 → com.cozbil.app App Store distribution
# Push Notifications? → Yes (expo-notifications aps-environment ister)
# Sonra provisioning profile’ı Yeniden oluştur (Push sonrası zorunlu)

# İlk başarılı build (cloud kota varsa en kolayı):
eas build --platform ios --profile production
# Wizard bitene kadar onayla. Bitince credentials Expo’da kalır.
```

### Push Notifications profile hatası (sık)

Actions / local log:

`Provisioning profile … doesn't support the Push Notifications capability`  
`aps-environment … is not registered for profile`

**Kök neden:** `expo-notifications` çoğu zaman `aps-environment`'i yalnızca prebuild **modifier** ile ekler. EAS capability sync **statik** `ios.entitlements` okur — yoksa `Synced capabilities: No updates` der, Apple App ID'ye Push eklenmez; profil yenilense bile Push yok kalır.

Repoda `apps/mobile/app.json`:

```json
"ios": { "entitlements": { "aps-environment": "production" } }
```

Bu değişiklik `main`'de olmalı. Sonra Mac:

```bash
cd ~/agent
git checkout main && git pull
cd apps/mobile
eas credentials -p ios
# All: Set up all the required credentials
# Beklenen: Synced capabilities → Push eklendi (No updates DEĞİL)
# Generate new Provisioning Profile → Y
```

Hâlâ No updates ise: [Apple Identifiers](https://developer.apple.com/account/resources/identifiers/list) → `com.cozbil.app` → **Push Notifications** Enable → Save → Confirm → profil sil/yenile.

Sonra Actions **iOS production IPA** yeniden (veya Mac `--local`).

Kotan yoksa Mac local (yine interaktif, `--non-interactive` **kullanma**):

```bash
export EXPO_PUBLIC_FIREBASE_API_KEY='...'
export EXPO_PUBLIC_FIREBASE_APP_ID='...'
export EAS_LOCAL_BUILD_WORKINGDIR=$HOME/eas-local-build
eas build --platform ios --profile production --local
```

Bu **bir kez** başarılı olduktan sonra Actions tekrar çalışır.

---

## A) GitHub Actions (credentials sonrası)

1. Secrets: `EXPO_TOKEN`, Firebase public key’ler (Android ile aynı).  
2. Actions → **iOS production IPA** → Run (`main`)  
3. Artifact: `cozbil-ios-production-ipa`

Workflow: `.github/workflows/ios-production-ipa.yml`  
Not: macOS runner dakikası pahalıdır. CI hata mesajı credentials’a indirgemez — gerçek root cause’u yazar.

### OpenIAP / StoreKit compile errors (Xcode 26.4)

Log örnekleri:

`Product.SubscriptionInfo has no member 'pricingTerms'`  
`Transaction has no member 'billingPlanType'` / `commitmentInfo`  
`RenewalInfo has no member 'renewalBillingPlanType'`

**Kök neden:** `expo-iap` → CocoaPods `openiap` StoreKit “billing plan” API’lerini `#if compiler/swift(>=6.3)` arkasına koyuyor. Xcode **26.4** Swift 6.3 getirir ama bu semboller **Xcode 26.5+ SDK**’da (OpenIAP yorumu da bunu söylüyor).

**Repoda fix:** `apps/mobile/plugins/withOpenIapXcodeCompat.js` — prebuild Podfile `post_install` içinde bu guard’ları kapatır. ÇözBil standart haftalık/aylık/yıllık abonelik kullanır; 12 aylık commitment billing plan lazım değil.

Mac’te (credentials sonrası):

```bash
cd ~/agent && git checkout main && git pull
cd apps/mobile
rm -rf ios
# Firebase env hazırsa:
eas build --platform ios --profile production --local --output ~/Desktop/cozbil-production.ipa
```

Build log’ta şunu ara: `[cozbil] OpenIAP Xcode 26.4 StoreKit compat`.

**Alternatif:** App Store’dan **Xcode 26.5+** kur → aynı hatayı upstream da çözmüş olur; plugin yine zararsız kalır.

### ExpoModulesJSI / SPM archive fail

Log: `Could not resolve package dependencies` + `Build ExpoModulesJSI xcframework`.

Credentials tamamdır (`All credentials are ready…`); Xcode/SPM tarafı. GHA’da tekrarlayan SPM hatası için **Mac local** tercih et:

```bash
cd ~/agent/apps/mobile
rm -rf ios
export EAS_LOCAL_BUILD_WORKINGDIR=$HOME/eas-local-build
# Firebase: eas env:pull --environment production  (veya export EXPO_PUBLIC_FIREBASE_*)
eas build --platform ios --profile production --local --output ~/Desktop/cozbil-production.ipa
```

Not: Non-interactive log’taki `Distribution Certificate is not validated` uyarısı normaldir; credentials eksik demek değildir.

## B) Mac script (credentials sonrası)

```bash
bash scripts/build-ios-ipa-local.sh
```

## EAS submit alanları

| Alan | Değer |
|------|--------|
| `appleTeamId` | `J46LLRJA44` |
| `ascAppId` | ASC App Information → Apple ID (sayı) — `REPLACE_*` ise submit öncesi doldur |

## Checklist

- [x] Bundle ID `com.cozbil.app`
- [x] Static `ios.entitlements.aps-environment` (EAS capability sync)
- [ ] Mac’te credentials sync Push + profile yenile → CI IPA yeşil
- [ ] ASC app + IAP
- [ ] Actions IPA yeşil
- [ ] `ascAppId` + TestFlight submit
- [ ] Functions Apple API secrets (satın alma verify)
