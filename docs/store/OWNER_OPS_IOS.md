# Owner ops — iOS store-ready (kod: App Store Server API live)

**Tarih:** 2026-07-23  
**Branch:** `cursor/solve-word-eq-proxy-6767` / PR #18  
**Önkoşul:** Android AAB yolu açık; privacy/terms hosting canlı.

Agent kodu: `verifyAppStorePurchase` artık App Store Server API çağırır (credential yoksa elevate yok).

## Sprint I — TestFlight

1. **Apple Developer + App Store Connect**
   - [ ] App `com.cozbil.app` (bundle id = Android package ile aynı)
   - [ ] 3 auto-renewable IAP (aynı product id’ler):
     - `cozbil_premium_weekly_intro`
     - `cozbil_premium_monthly`
     - `cozbil_premium_yearly`
   - [ ] Paid Apps Agreement + banking/tax

2. **App Store Connect API key (Functions)**
   - Users and Access → Integrations → In-App Purchase → Key oluştur (.p8)
   - Functions env / secret:
     ```bash
     # örnek — değerleri chat’e yapıştırma
     APPLE_BUNDLE_ID=com.cozbil.app
     APPLE_ISSUER_ID=...
     APPLE_KEY_ID=...
     APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
     # opsiyonel: Production | Sandbox (yoksa Production→Sandbox fallback)
     APPLE_IAP_ENVIRONMENT=Sandbox
     ```
   - Deploy: `bash scripts/deploy-store-functions.sh` (syncSubscription dahil)

3. **EAS iOS submit alanları**
   - `apps/mobile/eas.json` → `submit.production.ios`:
     - `ascAppId`: App Store Connect numeric app id
     - `appleTeamId`: Apple Team ID
   - Commit veya lokal overwrite (repoya gerçek id koyabilirsin)

4. **Build / TestFlight**
   ```bash
   cd apps/mobile
   eas build --platform ios --profile production
   eas submit --platform ios --profile production --latest
   ```
   - [ ] TestFlight internal smoke: onboarding → solve → paywall restore

5. **Legal / listing**
   - [ ] Privacy + terms URL (zaten hosting)
   - [ ] Screenshots / ASO (sen hazır)
   - [ ] Age rating / export / encryption questionnaires

## Sprint J — App Store review

1. [ ] ASC’de IAP “Ready to Submit” + app version’a bağla  
2. [ ] Production track → Submit for Review  
3. [ ] `APPLE_IAP_ENVIRONMENT` production’da boş bırak veya `Production`  
4. [ ] Org policy invoker (Android ile aynı) — callable’lar iOS’ta da lazım  

## Kod referansı

- `functions/src/subscription/verifyAppStorePurchase.ts`
- `apps/mobile/src/features/paywall/billing.ts` (iOS transaction id / JWS proof)
- `docs/store/iap-admob-readiness.md`
