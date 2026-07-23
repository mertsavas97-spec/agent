# ÇözBil — Store submission readiness audit (Android + iOS)

**Date:** 2026-07-23  
**Scope:** `/workspace` factual inventory for first Play / App Store submit  
**Product brief:** Android-first; iOS secondary (`PROJECT_BRIEF.md`)  
**Prior audits:** `docs/audits/mvp-1.0-launch-ready-audit-2026-07-20.md` (NO-GO), `docs/audits/mvp-1.0-comprehensive-audit-2026-07-21.md` (Store NO-GO)  
**Sprint state:** `SPRINT_STATE.md` — Sprint 4 + 1.0 final audit; owner steps open

**Overall verdict:** **NO-GO** for production store submit. Dogfood / internal preview: **PARTIAL-GO**.

---

## Scorecard (0–100)

| Alan | Puan | Not |
|------|-----:|-----|
| Ürün kapsamı (4 sınav, MVP akış) | **88** | LGS+YGS+KPSS+Ehliyet kilitli; konu/çözüm/dogfood olgun |
| UI / UX / moodboard | **78** | Ana akışlar var; store screenshot seti yok |
| Mobil kod kalitesi / test | **72** | Mobile typecheck+Jest yeşil; lint/CI yok |
| EAS / native build iskeleti | **55** | Profile+AAB hazır; `owner`/`projectId` boş |
| Production solve (Firebase/AI) | **42** | Proxy dogfood; prod trigger/Vertex smoke owner |
| Play IAP (billing) | **48** | Client+verify kodu var; Console ürün/secret yok |
| App Store IAP | **22** | Product id SSoT; StoreKit verify yok |
| AdMob / ads | **35** | Policy+stub; native SDK yok; +1 grant stub |
| Legal / KVKK | **50** | In-app + draft privacy URL; counsel final yok; /terms 404 |
| Store listing varlıkları | **40** | Metin/ASO/icon draft; screenshot+feature graphic yok |
| Push | **60** | Cihaz-içi local hazır; remote yok (v1 için OK) |
| **Android Play — production submit** | **38 / 100** | **NO-GO** |
| **Android Play — internal/closed test** | **52 / 100** | Blocker’lar kapanınca mümkün |
| **iOS App Store** | **28 / 100** | **NO-GO** (brief: iOS birincil değil) |
| **Dogfood / internal preview build** | **70 / 100** | Bugün için en gerçekçi hedef |

**Okuma:** 80+ store-ready · 60–79 soft-launch adayı · 40–59 iskelet+kod · &lt;40 submit etme.

---

## Area status (READY / PARTIAL / MISSING)

### 1. EAS / build config — **PARTIAL**

| Item | Status | Evidence |
|------|--------|----------|
| `eas.json` profiles | READY (skeleton) | `/workspace/apps/mobile/eas.json` — `development` / `preview` / `production`; production AAB + `distribution: store` + `autoIncrement` |
| Production env | PARTIAL | Privacy URL + support email + ads stub off + sandbox off set in production profile; Firebase public keys **not** in `eas.json` (must be EAS secrets — `docs/setup/EAS_PRODUCTION.md`) |
| `app.config.js` strips `expo-dev-client` | READY | `/workspace/apps/mobile/app.config.js` filters plugin when `EAS_BUILD_PROFILE=production` |
| Bundle / package IDs | READY | `com.cozbil.app` iOS + Android — `/workspace/apps/mobile/app.json` |
| Version | PARTIAL | `version: "1.0.0"`; no explicit `android.versionCode` / `ios.buildNumber` (relies on EAS `autoIncrement`) |
| Icon / splash | READY | `assets/images/icon.png`, adaptive icons, `splash-icon.png` + navy `#1E1B4B`; also `docs/store/app-icon/playstore-512.png`, `ios-marketing-1024.png` |
| Permissions | PARTIAL | iOS camera/photo usage strings present; Android `permissions` array **absent** in `app.json`; `expo-image-picker` is a dependency but **not** listed under `plugins` (prebuild may miss manifest entries unless added) |
| Plugins | PARTIAL | `expo-router`, `expo-dev-client`, `expo-splash-screen`, `expo-iap`, `expo-notifications` — no AdMob plugin |
| EAS `projectId` / `owner` | **MISSING** | `extra.eas.projectId: ""`, `owner: ""` — blocks `eas build` / submit until `eas init` |
| Submit profile | PARTIAL | Android only: `track: internal`, `releaseStatus: draft`; **no iOS submit** block |

### 2. IAP / billing — **PARTIAL** (Android code path; store products + credentials missing)

| Item | Status | Evidence |
|------|--------|----------|
| Product IDs SSoT | READY | `cozbil_premium_weekly_intro` / `_monthly` / `_yearly` — `apps/mobile/src/features/paywall/pricing.ts`; prices 14,90 / 39 / 320 TRY |
| Client `expo-iap` | PARTIAL | Dependency + plugin + `billing.ts` purchase/restore → `syncSubscription` |
| Play verify (server) | PARTIAL | `functions/src/subscription/verifyPlayPurchase.ts` + `syncSubscription.ts` — returns `credentials_missing` until secrets set |
| Play Console products | **MISSING** | Checklist unchecked — `docs/store/iap-admob-readiness.md` |
| Play service account secrets | **MISSING** | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME` |
| iOS StoreKit verify | **MISSING** | No `verifyAppStorePurchase`; only `verifyPlayPurchase.ts` in `functions/src/subscription/` |
| Entitlement hydrate | PARTIAL | Local AsyncStorage hydrate; comprehensive audit still flags client `subscriptionStatus` server hydrate gap |
| Local / sandbox bypass | READY for prod intent | `canUseLocalPremium()` = `__DEV__` or `EXPO_PUBLIC_PREMIUM_SANDBOX`; production eas sets sandbox `0` |
| Readiness doc | READY (docs) | `docs/store/iap-admob-readiness.md` |

### 3. Ads / AdMob — **PARTIAL** (policy + stub only)

| Item | Status | Evidence |
|------|--------|----------|
| Policy copy / matrix | READY | `docs/product/ads-policy.md`; surface guards in `apps/mobile/src/features/ads/policy.ts` |
| Stub engine | READY | `adEngine.ts` always falls back to stub; BannerSlot shows “Reklam alanı · hazırlık” |
| Real SDK | **MISSING** | `react-native-google-mobile-ads` **not** in `package.json`; no `adMobEngine.ts` |
| Unit IDs | PARTIAL | Env schema + Google test units in `adUnits.ts`; production unit IDs not in repo (correct); not configured in `eas.json` production env |
| Rewarded +1 server grant | **MISSING** | `runRewardedExtra.ts`: “server grant TBD; stub marks local claim” |
| Child-directed AdMob settings | **MISSING** | Documented as owner console step only |

### 4. Auth / Firebase / backend (production solve) — **PARTIAL**

| Item | Status | Evidence |
|------|--------|----------|
| Anonymous auth client | READY (code) | `apps/mobile/src/lib/auth.ts` — `signInAnonymously` |
| Firebase config | PARTIAL | `firebase.ts` + `.env.example`; live keys must be set for prod (`isFirebaseConfigured`) |
| Production solve path | PARTIAL / fragile | `solveClient.ts`: proxy (dogfood only) → Firestore/Storage trigger → callable fallback. Proxy must **not** ship in production (`EAS_PRODUCTION.md`). Org-policy blocks classic callable invoker — `docs/setup/ORG_POLICY_SOLVE_BYPASS.md` |
| Storage/Firestore triggers | PARTIAL | Documented path `onSolveUploadFinalized` / `onSolveRequestCreatedV2`; deploy/smoke is owner |
| Vertex / live AI | PARTIAL | Stub/demo possible without Vertex; production AI needs GCP/Vertex per setup docs |
| Account deletion | PARTIAL | Soft request UI + Functions `requestAccountDeletion`; hard purge pipeline still open on Play checklist |

### 5. Legal / KVKK — **PARTIAL**

| Item | Status | Evidence |
|------|--------|----------|
| In-app privacy / terms / KVKK | READY (draft copy) | `apps/mobile/src/features/legal/legalCopy.ts`; settings route `app/settings/legal/[id].tsx` |
| Privacy HTTPS URL | PARTIAL | Live at `https://cozbil-dev-f9583.web.app/privacy` (verified HTTP 200 content; page self-labels “Çalışma taslağı”). Wired in production `eas.json`. |
| Terms public URL | **MISSING** | `/terms` → 404; terms only in-app |
| Counsel-approved final | **MISSING** | Explicit in hosting page + `SPRINT_STATE.md` + checklists |
| Data Safety / content rating drafts | READY (docs) | `docs/store/play-data-safety-draft.md`, `play-content-rating-draft.md` — Console submit unchecked |
| Support email | READY | Default / env `destek@cozbil.app` |

### 6. Push — **PARTIAL**

| Item | Status | Evidence |
|------|--------|----------|
| Prefs + copy | READY | `pushPrefs.ts` |
| Local scheduling | READY (code) | `localPush.ts` via `expo-notifications` — **no FCM/APNs server** |
| Native rebuild | REQUIRED | Plugin in `app.json`; needs native build (dev client / EAS), not Expo Go |
| Remote push | **MISSING** | Explicitly backend-less; not a hard store blocker for v1 if honesty copy is clear |

### 7. Exam scope (LGS / YGS / KPSS / trafik) — **READY** (product)

| Item | Status | Evidence |
|------|--------|----------|
| Onboarding four options | READY | `onboarding/copy.ts` `EXAM_OPTIONS` — LGS, YGS, KPSS, Ehliyet (`trafik`) |
| Types + isolation | READY | `functions/src/theme/examTypes.ts`; mobile `examPipelineIsolation.ts` / `examModeGuard.ts` |
| Content / lessons | READY | Topic lesson bank covers all four; tests `contentCoverage.test.ts` |
| Brief / guardian | READY | `PROJECT_BRIEF.md` + `cozbil-guardian` — all four active (none “yakında”) |

### 8. QA — **PARTIAL**

| Item | Status | Evidence |
|------|--------|----------|
| Scripts | READY | Root `npm run typecheck` / `test` / `qa`; mobile `typecheck`, `test`, lint = echo stub |
| Mobile typecheck (this env) | PASS | `apps/mobile` `tsc --noEmit` exit 0 |
| Functions typecheck (this env) | FAIL / N/A | `functions` deps/`tsc` missing in workspace (`tsc: not found`) |
| Tests present | READY | ~69 mobile test files; ~28 functions test files |
| Lint | MISSING (real) | Mobile lint script is placeholder echo |
| CI | **MISSING** | No `.github/workflows` |
| Known gaps (docs) | — | Launch audit + comprehensive audit + Play checklist still list P0 store blockers |

### 9. Store listing assets — **PARTIAL**

| Item | Status | Evidence |
|------|--------|----------|
| Listing copy draft | READY | `docs/store/listing-copy-draft-tr.md` |
| ASO keyword map | READY | `docs/store/aso-keyword-map-tr.md` |
| Checklists | READY | `play-launch-checklist.md`, `app-store-launch-checklist.md` |
| App icons for stores | READY | `docs/store/app-icon/*` + in-app assets |
| Screenshots | **MISSING** | No device screenshot set in repo |
| Feature graphic 1024×500 | **MISSING** | Called out on Play checklist |
| Live Console listing | **MISSING** | Drafts only |

### 10. Blockers vs nice-to-haves — see ranked list below

---

## Top 10 blockers (ranked)

1. **EAS `owner` + `projectId` empty** — cannot run real `eas build` / submit (`apps/mobile/app.json`, `docs/setup/EAS_PRODUCTION.md`).
2. **Production solve path not store-proven** — org-policy callable 403; must ship Storage/Firestore trigger path with Vertex/demo verified; dogfood proxy must stay out of production (`ORG_POLICY_SOLVE_BYPASS.md`, `solveClient.ts`).
3. **Play Billing products + service-account verify credentials missing** — client/server code exists; Console SKUs + secrets do not (`iap-admob-readiness.md`, `verifyPlayPurchase.ts`).
4. **KVKK / privacy counsel final** — public URL is live but explicitly a working draft; store + TR compliance risk (`hosting/public/privacy/index.html`).
5. **Store listing visuals missing** — screenshots + Play feature graphic 1024×500 (`play-launch-checklist.md`).
6. **AdMob: no native SDK + no production unit wiring** — production `EXPO_PUBLIC_ADS_STUB=0` still stub-engine; shipping “ads” UI honesty or real SDK required (`adEngine.ts`, `BannerSlot.tsx`).
7. **Rewarded +1 is local stub only** — no server quota grant; monetization/policy mismatch if ads claim +1 (`runRewardedExtra.ts`).
8. **Firebase / Functions production secrets + rules deploy smoke** — EAS must inject Firebase public config; Firestore/Storage rules + Functions deploy verified (`EAS_PRODUCTION.md`, checklists).
9. **Android camera/media permission plugin gap** — `expo-image-picker` not in Expo plugins; Android `permissions` not declared in `app.json` (risk of missing CAMERA / media permissions after prebuild).
10. **iOS App Store path incomplete** (if iOS in first submit) — no StoreKit server verify, no iOS `submit` profile, `supportsTablet: true` without iPad assets; Android-first can defer iOS but must not claim dual launch.

### Nice-to-haves (not first-submit blockers if scoped)

- Remote FCM/APNs push  
- Real ESLint + GitHub Actions CI  
- Hard account purge pipeline  
- Item bank volume expansion  
- Analytics / funnel events  
- In-app review prompt  
- Separate public `/terms` URL  
- Dark mode / a11y polish  

---

## Platform recommendation

| Target | Verdict |
|--------|---------|
| **Google Play internal / closed testing** | PARTIAL-GO after blockers 1–5 + 8–9 closed; ads can ship as honest stub **or** hide until SDK |
| **Google Play production** | NO-GO until billing verify + counsel privacy + production solve smoke |
| **Apple App Store** | NO-GO / out of v1 primary scope per `PROJECT_BRIEF.md`; TestFlight only after iOS P0 checklist |

---

## Key file index

- Config: `apps/mobile/eas.json`, `app.json`, `app.config.js`, `package.json`, `.env.example`
- IAP: `src/features/paywall/{pricing,billing,entitlement,syncSubscriptionClient}.ts`, `functions/src/subscription/*`
- Ads: `src/features/ads/*`, `docs/product/ads-policy.md`, `docs/store/iap-admob-readiness.md`
- Auth/solve: `src/lib/{auth,firebase}.ts`, `src/features/solve/solveClient.ts`, `docs/setup/ORG_POLICY_SOLVE_BYPASS.md`
- Legal: `src/features/legal/*`, `hosting/public/privacy/`, `docs/legal/privacy-tr.html`
- Push: `src/features/push/{localPush,pushPrefs}.ts`
- Exams: `src/features/onboarding/copy.ts`, `functions/src/theme/examTypes.ts`
- Store docs: `docs/store/*`
- Audits: `docs/audits/mvp-1.0-*.md`, this file
