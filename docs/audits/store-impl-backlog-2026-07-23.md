# Store implement backlog — listing görselleri hariç

**Tarih:** 2026-07-23  
**Kapsam dışı (sen hazırlayacaksın):** Play/App Store screenshots, feature graphic 1024×500  
**Hedef:** Android-first submit için **kodda yapılabilecek** işler + owner-only ayrımı  
**Kaynak:** `store-submission-readiness-2026-07-23.md`, `play-launch-checklist.md`, `iap-admob-readiness.md`

---

## Özet verdict

| Katman | Durum |
|--------|--------|
| Agent’ın kapatabileceği P0 kod hijyeni | **Yapılabilir** (ads hide, permissions, IAP UX, terms HTML, solve/EAS guards) |
| Gerçek store submit | Hâlâ **NO-GO** — `eas init`, Play SKU/secret, counsel, prod solve smoke **owner** |
| Listing görselleri | **Pas** — bu audit’te skor/blocker sayılmaz |

---

## Matris (listing hariç)

| # | Konu | Kod durumu | Agent implement? | Owner? | Öncelik |
|---|------|------------|------------------|--------|---------|
| 1 | EAS `owner` / `projectId` | Boş | Check script + docs only | `eas init` | P0 |
| 2 | Android camera/media + `expo-image-picker` plugin | Eksik plugin/permissions | **Evet** | Cihazda doğrula | P0 |
| 3 | Production solve (proxy yok) | Proxy `__DEV__` gated; smoke owner | Guard/test/mesaj | Functions/Vertex/rules deploy | P0 |
| 4 | Play IAP UX (`credentials_missing`) | Kod var, UX zayıf | **Evet** | Console SKU + SA JSON | P0 |
| 5 | AdMob | Stub “hazırlık” görünür | **Hide stub (önerilen)** veya SDK | Unit id + child-directed | P0 hide / P1 SDK |
| 6 | Rewarded +1 server grant | Local stub | **Evet** (Functions + client) | Deploy | P1 |
| 7 | Legal `/terms` public page | Yok (404) | **Evet** HTML + `legalUrls` | Hosting deploy + counsel | P0 artefact |
| 8 | Privacy counsel final | Draft URL canlı | Banner/metin hizası | Avukat imza | Owner |
| 9 | Firebase public env → EAS | Docs var | Fail-fast + secret script docs | EAS secrets | P0 |
| 10 | Push `POST_NOTIFICATIONS` | Local push var | Android 13 permission polish | — | P1 |
| 11 | Account hard purge | Soft `deleteRequestedAt` | **Evet** purge callable/job | Prod ops | P1 |
| 12 | Entitlement server hydrate | AsyncStorage ağırlıklı | **Evet** | — | P1 |
| 13 | CI typecheck/test | Yok | **Evet** workflow | Actions açık | P1 |
| 14 | iOS StoreKit verify | Yok | Stub (Android-first’te P2) | ASC ürünler | P2 |
| 15 | Analytics | Yok | Wrapper + eventler | GA enable | P2 |
| 16 | In-app review | Yok | `expo-store-review` | — | P2 |
| 17 | Real ESLint | Echo stub | Config + script | — | P2 |

---

## P0 — Agent implement backlog (sırayla)

### P0-1 · Stub reklamı gizle (SDK yokken)
- **Neden:** Production `ADS_STUB=0` iken bile `BannerSlot` “Reklam alanı · hazırlık” gösteriyor → store/review riski.
- **Dosyalar:** `BannerSlot.tsx`, `policy.ts`, rewarded CTA yüzeyleri (`runRewarded*`, paywall/home).
- **Kabul:** SDK/`unitId` yoksa banner ve rewarded UI **render edilmez**; Premium kapısı aynı kalır.
- **Alternatif (büyük):** `react-native-google-mobile-ads` + plugin — owner unit id ister.

### P0-2 · `expo-image-picker` plugin + Android permissions
- **Dosya:** `apps/mobile/app.json` (+ gerekirse `app.config.js`).
- **Ekle:** plugin `expo-image-picker`; Android `CAMERA` + medya okuma (SDK 57 uyumlu).
- **Kabul:** Prebuild sonrası manifest’te kamera/galeri izinleri var.

### P0-3 · IAP `credentials_missing` dürüst UX
- **Dosyalar:** `syncSubscriptionClient.ts`, `billing.ts`, `premium.tsx` / restore.
- **Kabul:** Play verify secret yokken “satın alma doğrulanamadı / yapılandırma eksik” net mesaj; sahte Premium yok.

### P0-4 · Public terms sayfası
- **Dosyalar:** `hosting/public/terms/index.html` (`legalCopy` ile hizalı), `legalUrls.ts` → `termsUrl()`, `eas.json` production env `EXPO_PUBLIC_TERMS_URL`.
- **Kabul:** Artefact repoda; deploy owner (`firebase login --reauth`).

### P0-5 · EAS Firebase public env pattern
- **Dosyalar:** `docs/setup/EAS_PRODUCTION.md`, optional `scripts/check-eas-production-env.sh`, `app.config.js` prod fail-fast (API key yoksa uyarı/throw).
- **Kabul:** Repo’ya secret yazılmaz; checklist “EAS secret:create” komutları net.

### P0-6 · Production solve guard / test
- **Dosyalar:** `easProductionProfile.test.ts` (zaten proxy yok assert), `solveViaProxy` prod assert, `solveFailureMessage` trigger-path mesajları.
- **Kabul:** Production profile’da proxy env yok; release’te proxy yolu kapalı testle kanıtlı.
- **Owner:** Storage/Firestore trigger + Vertex smoke.

### P0-7 · EAS project check (placeholder)
- **Dosya:** `scripts/check-eas-project.sh` — `owner`/`projectId` boşsa exit 1.
- **Owner:** `eas init` değerleri doldurur.

---

## P1 — Submit kalitesi / politika

| ID | İş | Not | Durum |
|----|-----|-----|--------|
| P1-1 | `grantRewardedSolve` callable + client | Kota +1 sunucuda; rate-limit | **DONE** (deploy owner) |
| P1-2 | Account hard purge | Auth + Firestore/Storage cascade | **DONE** (`purgeAccount`) |
| P1-3 | Entitlement hydrate from `users/{uid}` | Restore sonrası tek kaynak | **DONE** |
| P1-4 | CI: typecheck + jest | `.github/workflows/ci.yml` | **DONE** |
| P1-5 | `POST_NOTIFICATIONS` + privacy hizası | Local push v1 | **DONE** |

---

## P2 — Sonra / iOS

- StoreKit `verifyAppStorePurchase` stub → full  
- Analytics event wrapper  
- In-app review  
- Real AdMob SDK (P0 hide yerine)  
- ESLint gerçek kurulum  
- `supportsTablet: false` veya iPad assets  

---

## Owner-only (agent kapamaz)

1. `eas login` + `eas init` → `owner` / `projectId`  
2. Play Console: app, imza, 3 abonelik SKU, license testers, Data Safety/content rating submit  
3. `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` + `PLAY_PACKAGE_NAME` (Functions)  
4. EAS secrets: Firebase public keys (+ AdMob units if live)  
5. Hosting deploy (privacy final + terms) — `firebase login --reauth`  
6. Counsel imzalı KVKK/gizlilik  
7. Production Functions/rules/Vertex solve smoke (proxy’siz)  
8. **Listing screenshots + feature graphic** (sen)  
9. AdMob console child-directed (canlı reklam seçilirse)  
10. iOS ASC / StoreKit (iOS launch kararı varsa)

---

## Önerilen uygulama sırası (agent sprint)

```
P0-1 ads hide
 → P0-2 image-picker permissions
 → P0-3 IAP credentials UX
 → P0-4 terms hosting page + legalUrls
 → P0-5/P0-7 EAS docs + check scripts
 → P0-6 solve prod guards
 → (sonra) P1-1…P1-5
```

**Tahmini teknik hacim:** P0 ≈ orta (çok dosya, düşük risk); P1 grant+purge ≈ orta–yüksek.

---

## Scorecard güncellemesi (listing pas)

Listing görselleri skor dışında bırakılırsa Android production tahmini **~38 → ~45** (hâlâ NO-GO).  
P0 agent paketi + owner EAS/SKU/counsel sonrası internal test **~52 → ~70+** bandına çıkabilir.

---

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** QA, Mobile, Growth, Guardian  
**Skill/agent setleri:** cozbil-team-skills, ship-gate (audit), cozbil-guardian  
**Skill bypass:** implementasyon bu turda yok — backlog audit  
**QA Gate:** inventory PASS / listing excluded / guardian PASS  
**Sonraki önerilen adım:** Kullanıcı onayıyla P0-1…P0-7 implement sprint’i
