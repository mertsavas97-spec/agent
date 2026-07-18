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

## Verification gate

- Unit tests green for quota, moderation branch, streak date logic
- Contract fixtures match `contracts/*.md`
- Manual Android device smoke on dogfood path
