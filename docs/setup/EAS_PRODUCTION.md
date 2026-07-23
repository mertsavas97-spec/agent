# EAS production — ÇözBil (Sprint 4)

Android-first store build. Dogfood proxy **production’a girmez**.

## Owner önkoşulları (agent yapamaz)

1. Expo hesabı + `eas login`
2. `cd apps/mobile && eas init` → `app.json` / `extra.eas.projectId` + `owner` dolar  
   Doğrula: `bash scripts/check-eas-project.sh` (boşsa exit 1)
3. Play Console app (`com.cozbil.app`) + service account JSON for `eas submit`
4. Firebase Hosting privacy + terms canlı:  
   `https://cozbil-dev-f9583.web.app/privacy`  
   `https://cozbil-dev-f9583.web.app/terms`  
   (`docs/store/hosting-deploy-runbook.md`)
5. Counsel onaylı gizlilik / koşullar metni (taslak host edilir; final imza owner)

## Profil özeti (`eas.json`)

| Profile | Amaç |
|---------|------|
| `development` | Dev client + APK |
| `preview` | Internal APK, stub ads |
| `production` | AAB, store; **no** `EXPO_PUBLIC_SOLVE_PROXY_*`; sandbox premium off |

`app.config.js` production profilinde:
- `expo-dev-client` eklentisini çıkarır
- `EXPO_PUBLIC_FIREBASE_API_KEY` + `EXPO_PUBLIC_FIREBASE_APP_ID` yoksa **fail-fast** throw

## Komutlar

```bash
cd apps/mobile
# projectId/owner doldurulduktan sonra:
bash ../../scripts/check-eas-project.sh
bash ../../scripts/check-eas-production-env.sh
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```

## Env (production profile)

Sabitlenenler `eas.json` → `build.production.env` içinde:

- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EXPO_PUBLIC_SUPPORT_EMAIL`
- `EXPO_PUBLIC_ADS_STUB=0`
- `EXPO_PUBLIC_PREMIUM_SANDBOX=0`

Firebase public key’ler **EAS Environment / secrets** ile eklenmeli (repoya yazılmaz):

```bash
eas env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --environment production --value '<Firebase Console web API key>'
eas env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --environment production --value '<Firebase Console app id>'
```

Diğer Firebase domain / project / bucket / sender değerleri `.env.example` ile hizalı; gerekirse aynı şekilde EAS env’e eklenir.

**Asla production’a koyma:** `EXPO_PUBLIC_SOLVE_PROXY_URL`, `EXPO_PUBLIC_SOLVE_PROXY_TOKEN`, `EXPO_PUBLIC_PREMIUM_SANDBOX=1`.

## Ads / IAP notları

- Production’da stub reklam UI gizlenir (`isLiveAdsDeliveryReady`); canlı AdMob unit + native SDK sonra.
- Play Billing verify secret yoksa kullanıcıya `credentials_missing` dürüst mesaj; sahte Premium yok.

## QA Gate (build öncesi)

```bash
npm run typecheck --prefix apps/mobile
npm test --prefix apps/mobile -- --testPathPattern='easProductionProfile|legalUrls|adUnits|billingFailure|solveViaProxy|PaywallScreen'
bash scripts/check-eas-production-env.sh
# Owner after eas init:
bash scripts/check-eas-project.sh
```
