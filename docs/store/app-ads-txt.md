# app-ads.txt (AdMob uygulama doğrulama)

**Sorun:** AdMob “app-ads.txt bilgileri hesabınızla eşleşmiyor” — canlı URL 404 idi.  
**Kök neden:** Dosya `hosting/public` içinde yoktu / Hosting’e deploy edilmemişti.

## Yayınlanan satır (AdMob snippet)

```
google.com, pub-4628962707131944, DIRECT, f08c47fec0942fa0
```

Kaynak dosya: `hosting/public/app-ads.txt`  
Canlı URL: `https://cozbil-dev-f9583.web.app/app-ads.txt`

## Owner adımları (zorunlu)

1. Repo’da dosya var (bu PR). Lokal doğrula:
   ```bash
   bash scripts/check-app-ads-txt.sh
   ```
2. Firebase Hosting deploy:
   ```bash
   npx firebase-tools login --reauth
   bash scripts/deploy-hosting-legal.sh
   ```
3. Smoke:
   ```bash
   APP_ADS_LIVE=1 bash scripts/check-app-ads-txt.sh
   curl -s https://cozbil-dev-f9583.web.app/app-ads.txt
   ```
   Beklenen: HTTP 200, `Content-Type: text/plain`, yukarıdaki satır.
4. **App Store Connect** → App Information → **Marketing URL** / developer website:
   `https://cozbil-dev-f9583.web.app`  
   (kök alan; path ekleme — AdMob bu domain’den `/app-ads.txt` çeker)
5. **Play Console** → Store listing → Developer website: aynı kök URL.
6. AdMob → Apps → ÇözBil iOS → **app-ads.txt güncellemelerini kontrol et**.

## Reklam unit’leri (banner / interstitial / rewarded)

Kod yolu hazır (`BannerSlot`, `adMobEngine`, `runInterstitialIfNeeded`, rewarded grant).  
Canlı store build için EAS **production** secret’ları:

```
EXPO_PUBLIC_ADS_STUB=0
EXPO_PUBLIC_ADS_USE_TEST_UNITS=0
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-4628962707131944~…
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-4628962707131944~…
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=…
EXPO_PUBLIC_ADMOB_BANNER_IOS=…
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID=…
EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS=…
EXPO_PUBLIC_ADMOB_REWARDED_ANDROID=…
EXPO_PUBLIC_ADMOB_REWARDED_IOS=…
```

- App id publisher segmenti `pub-4628962707131944` ile `app-ads.txt` satırı eşleşmeli.
- Unit id’ler yokken banner/UI gizli kalır (`isLiveAdsDeliveryReady`); test App ID fallback sadece native plugin içindir.
- Detay: `docs/store/iap-admob-readiness.md`

## Notlar

- Cloud agent Firebase login yapamaz; deploy owner Mac/CI’da.
- AdMob crawl gecikmeli olabilir; dosya 200 olduktan sonra “güncellemeleri kontrol et” yeterli.
