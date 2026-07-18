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

1. Fresh install → complete onboarding → select LGS (also smoke YGS and KPSS paths).
1b. Home üstündeki LGS/YGS/KPSS seçici ile mod değiştir → yeni çözümlerin prompt/katalogu değişir (geçmiş silinmez). Bkz. `docs/architecture/exam-pipeline.md`.
2. Home → **Fotoğraf Çek** veya **Galeriden Seç** (aynı pipeline) → analyzing progress (yükleme / güvenlik / çözüm) → stepped solution + note.
3. Tap “Anlamadım, tekrar açıkla” → second explanation.
4. History filter by topic; Progress shows weakest topic + streak.
5. Exhaust 5 free solves → paywall appears.
6. Upload blurry / diagram / NSFW test image → neutral reject, quota unchanged.

## Play Billing sandbox (US6 entitlement stub)

Play Billing is **not** fully wired in MVP code yet. The app shows the Premium
paywall (haftalık 14,90 · aylık 39 · yıllık 349 TL / “Hemen Başla”) when
`solveQuestion` returns `functions/resource-exhausted`. Canonical policy:
`docs/product/pricing-policy.md`. Entitlement sync lives in
`functions/src/subscription/syncSubscriptionStub.ts` and
`apps/mobile/src/features/paywall/entitlement.ts`.

Dogfood options:

1. **Server bypass** — set `users/{uid}.subscriptionStatus` to `active` in
   Firestore Emulator / console; next solve skips the daily 5 limit.
2. **Client sandbox flag** — `EXPO_PUBLIC_PREMIUM_SANDBOX=1` makes
   `startPremiumPurchase(planId)` succeed locally (UI dogfood only; server remains
   authoritative until real token verification ships).
3. **Play license testers** (production path) — create
   `cozbil_premium_weekly_intro`, `cozbil_premium_monthly`,
   `cozbil_premium_yearly`; add license testers; verify purchase token via
   Google Play Developer API inside a future `syncSubscription` callable,
   then write `subscriptionStatus`.

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

