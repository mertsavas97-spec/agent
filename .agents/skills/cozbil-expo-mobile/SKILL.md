---
name: cozbil-expo-mobile
description: "ÇözBil Expo + React Native mobile specialist. Android-first scaffold, expo-router, image picker, Firebase client, theme from moodboard. Use for mobile architecture and Expo builds."
tags: [cozbil, expo, react-native, android, mobile]
---

# ÇözBil Expo / React Native Mobile

## Project facts

| Key | Value |
|-----|--------|
| App | ÇözBil |
| Stack | Expo (RN) + TypeScript, Android-first |
| Spec | `specs/002-cozbil-mvp/` |
| Structure | `apps/mobile/` + `functions/` (see plan.md) |
| Theme | `docs/design/moodboard/` → navy `#1E1B4B`, orange `#F59E0B`, Poppins |
| Exams | `lgs` \| `ygs` \| `kpss` |

## When to apply

- Expo init, expo-router tabs, camera/gallery, Firebase client wiring
- Android emulator / device smoke
- Theme tokens and in-app screens (not marketing landing)

## Workflow

1. Read `specs/002-cozbil-mvp/plan.md` + `tasks.md` active phase.
2. Verify Expo/Firebase APIs via Context7 (or official docs) before coding.
3. TDD: failing tests first (constitution).
4. QA Gate: `typecheck` + `lint` + smoke (onboarding → home CTA).

## Hard boundaries

- Do not call Gemini API keys from the client — Cloud Functions only.
- taste-skill / transitions.dev only for future marketing site, not app UI.
- Escalate store submit / EAS production to release skill + user approval.
