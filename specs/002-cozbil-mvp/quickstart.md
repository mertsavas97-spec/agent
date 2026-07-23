# Quickstart: ÇözBil MVP (post-scaffold)

## Prerequisites

- Node 20+, Expo CLI, Firebase CLI
- GCP project with Gemini + Cloud Vision APIs enabled
- Firebase project (Auth, Firestore, Storage, Functions)

## Local loop

```bash
# from repo root after scaffold tasks
cd apps/mobile && npm install && npx expo start
cd ../../functions && npm install && npm run build
firebase emulators:start
```

Point mobile app at emulators via env (`EXPO_PUBLIC_USE_EMULATORS=1`).

## Dogfood path (maps to US1–US6)

1. Fresh install → complete onboarding → select LGS (also smoke YGS, KPSS, and Ehliyet paths).
1b. Home üstündeki LGS/YGS/KPSS/Ehliyet seçici ile mod değiştir → yeni çözümlerin prompt/katalogu değişir (geçmiş silinmez). Bkz. `docs/architecture/exam-pipeline.md`.
2. Home → **Fotoğraf Çek** veya **Galeriden Seç** (aynı pipeline) → analyzing progress (yükleme / güvenlik / çözüm) → stepped solution + note.
3. Tap “Anlamadım, tekrar açıkla” → second explanation.
4. History filter by topic; Progress shows weakest topic + streak.
5. Exhaust 5 free solves → paywall appears.
6. Upload blurry / diagram / NSFW test image → neutral reject, quota unchanged.

## Play Billing (US6 entitlement)

**Sprint 2 (2026-07-21):** Client uses **expo-iap** (Expo Play Billing / StoreKit path) →
callable `syncSubscription` → Google Play Developer API verify when credentials set.

Canonical policy: `docs/product/pricing-policy.md`.  
SKU: `cozbil_premium_weekly_intro`, `cozbil_premium_monthly`, `cozbil_premium_yearly`.

### Production path
1. Create Play Console subscriptions matching SKUs; license testers.
2. Set Functions secrets/env:
   - `PLAY_PACKAGE_NAME=com.cozbil.app`
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=<service-account-json>`
3. Client `purchasePremiumPlan` → purchaseToken → `syncSubscription` →
   `users/{uid}.subscriptionStatus=active`.
4. **Local `activateLocalPremium` is blocked outside `__DEV__` / sandbox.**

### Dogfood options
1. **Server bypass** — set `users/{uid}.subscriptionStatus` to `active` in
   Firestore console (quota authoritative).
2. **Client + server sandbox** — `EXPO_PUBLIC_PREMIUM_SANDBOX=1` on app **and**
   `COZBIL_BILLING_SANDBOX=1` on Functions for callable sandbox elevate;
   client also mirrors local entitlement for UI.
3. **Dev local** — `__DEV__` builds may activate local entitlement for UI dogfood
   (does **not** change server quota until sync/Firestore).

Code: `apps/mobile/src/features/paywall/{billing,entitlement,syncSubscriptionClient}.ts`,
`functions/src/subscription/{syncSubscription,verifyPlayPurchase}.ts`.


## Ads stub (free tier)

AdMob native SDK is **not** linked yet (Expo Go). Client scaffold:
`apps/mobile/src/features/ads/` + `docs/product/ads-policy.md`.

- Free tabs show a banner **placeholder** (`ads-banner-slot`).
- After ≥3 billed solves, leaving solution via **Tamam** may fire stub interstitial (≤1/day).
- Paywall secondary CTA **Reklam izle · +1 soru** uses stub rewarded.
- Premium / `EXPO_PUBLIC_PREMIUM_SANDBOX=1` ⇒ no ads.
- Production: EAS + `react-native-google-mobile-ads` (see ads-policy).

## Verification gate

- Unit tests green for quota, moderation, streak, paywall, ads policy
- Contract fixtures match `contracts/*.md`
- Manual Android device smoke on dogfood path

