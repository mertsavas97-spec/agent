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
2. Home → capture a clear math text problem → see stepped solution + note.
3. Tap “Anlamadım, tekrar açıkla” → second explanation.
4. History filter by topic; Progress shows weakest topic + streak.
5. Exhaust 5 free solves → paywall appears.
6. Upload blurry / diagram / NSFW test image → neutral reject, quota unchanged.

## Play Billing sandbox (US6 entitlement stub)

Play Billing is **not** fully wired in MVP code yet. The app shows the Premium
paywall (49 TL / “Hemen Başla”) when `solveQuestion` returns
`functions/resource-exhausted`. Entitlement sync lives in
`functions/src/subscription/syncSubscriptionStub.ts` and
`apps/mobile/src/features/paywall/entitlement.ts`.

Dogfood options:

1. **Server bypass** — set `users/{uid}.subscriptionStatus` to `active` in
   Firestore Emulator / console; next solve skips the daily 5 limit.
2. **Client sandbox flag** — `EXPO_PUBLIC_PREMIUM_SANDBOX=1` makes
   `startPremiumPurchase()` succeed locally (UI dogfood only; server remains
   authoritative until real token verification ships).
3. **Play license testers** (production path) — create product
   `cozbil_premium_monthly`, add license tester accounts in Play Console,
   verify purchase token via Google Play Developer API inside a future
   `syncSubscription` callable, then write `subscriptionStatus`.

## Verification gate

- Unit tests green for quota, moderation branch, streak date logic, paywall UI
- Contract fixtures match `contracts/*.md`
- Manual Android device smoke on dogfood path

