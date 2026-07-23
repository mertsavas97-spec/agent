# Owner ops — Android store-ready (agent kodu bitti)

**Tarih:** 2026-07-23  
**Amaç:** Internal test → production submit için owner checklist  
**Kod branch:** `cursor/solve-word-eq-proxy-6767` / PR #18

Agent tarafı (P0–P2) kapandı. Aşağıdakiler **hesap / konsol / deploy** ister.

## Sprint A — Internal / closed test (~1 paket)

1. **Expo**
   - [ ] `eas login`
   - [ ] `cd apps/mobile && eas init` → `owner` + `projectId`
   - [ ] `bash scripts/check-eas-project.sh`

2. **EAS secrets / env (production)**
   - [ ] `EXPO_PUBLIC_FIREBASE_API_KEY`
   - [ ] `EXPO_PUBLIC_FIREBASE_APP_ID`
   - [ ] (opsiyonel canlı reklam) `EXPO_PUBLIC_ADMOB_*` unit + app ids  
     Yoksa native plugin Google **test app id** ile prebuild olur; üretimde unit yokken reklam UI gizli kalır.

3. **Functions deploy**
   - [ ] `grantRewardedSolve`, `purgeAccount`, `syncSubscription` (ios platform dahil)
   - [ ] Play: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` + `PLAY_PACKAGE_NAME=com.cozbil.app`

4. **Play Console**
   - [ ] App `com.cozbil.app`
   - [ ] 3 abonelik SKU (pricing SSoT)
   - [ ] License testers
   - [ ] Internal testing track

5. **Hosting**
   - [ ] `firebase login --reauth`
   - [ ] `bash scripts/deploy-hosting-legal.sh` (privacy + terms)
   - [ ] URL smoke: privacy + terms 200

6. **Prod solve smoke (proxy yok)**
   - [ ] Storage/Firestore trigger + Vertex path
   - [ ] Release build’de `EXPO_PUBLIC_SOLVE_PROXY_*` yok

7. **Build / submit**
   ```bash
   cd apps/mobile
   eas build --platform android --profile production
   eas submit --platform android --profile production --latest
   ```

## Agent-side gate (credential yok)

```bash
bash scripts/check-store-preflight.sh
```

Store callables (login sonrası):

```bash
bash scripts/deploy-store-functions.sh
# optional solve triggers: WITH_SOLVE=1 bash scripts/deploy-store-functions.sh
```

## Sprint B — Production submit (+1 paket)

1. [ ] Counsel imzalı gizlilik / koşullar (aynı URL)
2. [ ] Play Data Safety + content rating submit
3. [ ] Listing screenshots + feature graphic 1024×500 (sen)
4. [ ] (İsteğe) gerçek AdMob unit ids + child-directed console
5. [ ] Production track promote

## iOS (Android ile paralel hazırlık)

1. [ ] ASC app + aynı product id’ler  
2. [ ] `eas.json` → `submit.production.ios` içindeki `REPLACE_*` değerlerini doldur  
3. [ ] Apple API key env → `verifyAppStorePurchase` live (kod hazır; secret owner)  
4. [ ] TestFlight → App Store  

Detay: `docs/store/OWNER_OPS_IOS.md`

## Doğrulama komutları

```bash
bash scripts/check-store-preflight.sh
npm run typecheck
npm run lint --prefix apps/mobile
npm test --prefix apps/mobile -- --ci
npm test --prefix functions -- --ci
bash scripts/check-eas-production-env.sh
bash scripts/check-eas-project.sh   # eas init sonrası
```

## Referans

- `docs/setup/EAS_PRODUCTION.md`
- `docs/store/iap-admob-readiness.md`
- `docs/store/hosting-deploy-runbook.md`
- `docs/audits/store-impl-backlog-2026-07-23.md`
- `scripts/deploy-store-functions.sh`
- `scripts/deploy-hosting-legal.sh`