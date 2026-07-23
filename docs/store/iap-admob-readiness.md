# IAP + AdMob 1.0 readiness (iOS + Android)

**Durum:** Policy + stub wiring tamam. Canlı SDK / store ürünleri owner adımı.

## Premium ürün ID’leri (her iki mağaza)

| Plan | Product ID | TRY |
|------|------------|-----|
| Haftalık | `cozbil_premium_weekly_intro` | 14,90 / 7 gün |
| Aylık | `cozbil_premium_monthly` | 39 / ay |
| Yıllık | `cozbil_premium_yearly` | 320 / yıl |

Kaynak: `apps/mobile/src/features/paywall/pricing.ts` + `docs/product/pricing-policy.md`.

### Android (Play Billing)
- [ ] Play Console’da 3 abonelik oluştur (aynı product id)
- [ ] `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` + `PLAY_PACKAGE_NAME=com.cozbil.app` Functions secrets
- [ ] License testers
- [x] Client: `expo-iap` + `billing.ts` → `syncSubscription` callable
- [x] Server: `verifyPlayPurchase.ts`

### iOS (StoreKit)
- [ ] App Store Connect’te aynı product id’lerle auto-renewable
- [ ] App Store Connect API key env: `APPLE_BUNDLE_ID` / `APPLE_ISSUER_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY`
- [x] Backend stub: `verifyAppStorePurchase.ts` + `syncSubscription(platform: 'ios')` (credentials_missing / not_implemented — asla sahte elevate)
- [ ] Full App Store Server API client (stub → live)
- [x] Client product id SSoT hazır; `expo-iap` iOS’u da hedefler (`platform` gönderir)
- [ ] Production EAS iOS submit profili
- [x] `supportsTablet: false` (phone-first)

## Reklam formatları

| Format | Free | Premium | Kod | Canlı AdMob |
|--------|------|---------|-----|-------------|
| Banner | Tab shell | Kapalı | `BannerSlot` | Unit id + SDK |
| Interstitial | Çözüm çıkışı (≤5/gün, her billed leave) | Kapalı | `runInterstitialIfNeeded` | Unit id + SDK |
| Rewarded | Kota bitince +1; her çoklu açılış | Kapalı | `runRewarded*` | Unit id + SDK |

### Env (EAS secrets)

```
EXPO_PUBLIC_ADS_STUB=0
EXPO_PUBLIC_ADS_USE_TEST_UNITS=0
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-…
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-…
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=…
EXPO_PUBLIC_ADMOB_BANNER_IOS=…
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID=…
EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS=…
EXPO_PUBLIC_ADMOB_REWARDED_ANDROID=…
EXPO_PUBLIC_ADMOB_REWARDED_IOS=…
```

Dogfood: `EXPO_PUBLIC_ADS_STUB=1` veya test unit (`EXPO_PUBLIC_ADS_USE_TEST_UNITS=1`).

### Native SDK
```
npx expo install react-native-google-mobile-ads
```
Sonra `app.config.js` plugin + EAS prebuild. Çocuk / LGS: AdMob child-directed ayarları konsolda.

## Guardrails
- Solve / analyzing yüzeyinde reklam yok (`adsAllowedOnSurface`).
- Rewarded +1 henüz sunucu grant değil — UI stub; Functions grant Sprint 4+ owner.
- Production `eas.json` varsayılanı stub kapatılabilir; SDK yoksa engine stub’a düşer.
