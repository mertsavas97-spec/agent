# Apple App Store / TestFlight — MVP 1.0 Launch Checklist

> Android-first strateji: iOS **opsiyonel**. iOS launch edilecekse tüm P0 zorunlu.  
> Bundle ID: `com.cozbil.app`

## Karar

- [ ] iOS 1.0 launch kapsamında mı? (Hayır → internal/TestFlight only; store metadata üretme)

## P0 — iOS launch edilecekse

- [ ] Apple Developer Team + App Store Connect app record
- [ ] EAS iOS production profile + credentials + `submit.production`
- [ ] `owner` / `projectId` dolu; production’dan `expo-dev-client` çıkar
- [ ] Icon/splash (mevcut `assets/images/*` doğrula) + iPhone screenshots (± iPad if `supportsTablet: true`)
- [ ] Privacy Policy URL + App Privacy nutrition labels
- [ ] `PrivacyInfo.xcprivacy` (Expo prebuild çıktısı doğrula)
- [ ] Camera / Photo Library usage strings final (TR)
- [ ] StoreKit / IAP products + restore purchase (local entitlement yasak)
- [ ] Subscription legal copy App Store kurallarına göre (Play-only metinleri branch’le)
- [ ] Age rating + Kids / education / UGC photo answers
- [ ] KVKK + support URL
- [ ] TestFlight smoke: onboarding, camera, gallery, solve, paywall, offline, exam switch

## P1

- [ ] ATT only if tracking/ads SDK; else omit `NSUserTrackingUsageDescription`
- [x] Tablet support: `supportsTablet: false` (phone-first; iPad assets yok)
- [ ] Minör / guardian policy App Review notes
- [ ] Pricing / exam scope copy = Android ile aynı karar

## P2

- [ ] Low-network / permission denied regression
- [ ] In-app review (`SKStoreReviewController` / Expo StoreReview)
