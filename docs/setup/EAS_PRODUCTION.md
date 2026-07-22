# EAS production — ÇözBil (Sprint 4)

Android-first store build. Dogfood proxy **production’a girmez**.

## Owner önkoşulları (agent yapamaz)

1. Expo hesabı + `eas login`
2. `cd apps/mobile && eas init` → `app.json` / `extra.eas.projectId` + `owner` dolar
3. Play Console app (`com.cozbil.app`) + service account JSON for `eas submit`
4. Firebase Hosting privacy canlı: `https://cozbil-dev-f9583.web.app/privacy`  
   (`docs/store/hosting-deploy-runbook.md`)
5. Counsel onaylı gizlilik metni (taslak host edilir; final imza owner)

## Profil özeti (`eas.json`)

| Profile | Amaç |
|---------|------|
| `development` | Dev client + APK |
| `preview` | Internal APK, stub ads |
| `production` | AAB, store; **no** `EXPO_PUBLIC_SOLVE_PROXY_*`; sandbox premium off |

`app.config.js` production profilinde `expo-dev-client` eklentisini çıkarır.

## Komutlar

```bash
cd apps/mobile
# projectId/owner doldurulduktan sonra:
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```

## Env (production profile)

Sabitlenenler `eas.json` → `build.production.env` içinde.  
Firebase public key’ler Expo secrets / EAS env ile eklenmeli:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- (domain / project / bucket / sender zaten `.env.example` ile hizalı)

**Asla production’a koyma:** `EXPO_PUBLIC_SOLVE_PROXY_URL`, `EXPO_PUBLIC_SOLVE_PROXY_TOKEN`, `EXPO_PUBLIC_PREMIUM_SANDBOX=1`.

## QA Gate (build öncesi)

```bash
npm run typecheck --prefix apps/mobile
npm test --prefix apps/mobile -- --testPathPattern='easProductionProfile|legalUrls|PaywallScreen'
```
