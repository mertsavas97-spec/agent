# Implementation Plan: ÇözBil MVP 1.0

**Branch**: `002-cozbil-mvp` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-cozbil-mvp/spec.md`

## Summary

Android-first React Native (Expo) uygulaması: kullanıcı soru fotoğrafı çeker →
SafeSearch moderasyonu → dedup/cache → Gemini Vision ile **sınav-aware**
(LGS / YGS / KPSS) adım adım Türkçe çözüm → konu etiketi + geçmiş/istatistik/
streak → freemium paywall. UI moodboard token’ları + robot loading maskotu.
Backend MVP: Firebase (Auth, Firestore, Cloud Functions, FCM). Veli raporu,
geometri diyagram render ve pratik session 1.1/1.2’ye bırakılır.

## Technical Context

**Language/Version**: TypeScript (strict), Node 20 for Cloud Functions

**Primary Dependencies**: Expo (RN), expo-router, expo-image-picker (MVP
kamera/galeri; vision-camera gerekirse sonraki iterasyon), Firebase JS +
Admin SDK, Google Gemini Vision API, Google Cloud Vision SafeSearch,
React Native Testing Library + Jest, Detox or Maestro later for E2E

**Storage**: Cloud Firestore + Cloud Storage (soru görselleri); istemci
AsyncStorage yalnızca ephemeral UI state

**Testing**: Jest + RNTL (unit/component), Firebase emulator tests for
functions/contracts, TDD per constitution

**Target Platform**: Android 10+ primary via Expo; iOS build optional later

**Project Type**: mobile-app + serverless API (Cloud Functions)

**Performance Goals**: Desteklenen soruda kullanıcı 60 sn içinde adımlı
çözüm ekranına ulaşır (p95 lab); cache hit’te <3 sn algılanan yanıt

**Constraints**: Çocuk kitlesi → SafeSearch zorunlu; günlük/saatlik rate
limit; AI maliyeti Google kredisiyle yönetilir ama yine de dedup + kota;
Türkçe karakter tipografi; diyagram/geometri MVP dışı

**Scale/Scope**: MVP ~10 moodboard ekranı; Premium 3 plan (hafta/ay/yıl); üç sınav
track’i; matematik konu katalogları (LGS/YGS/KPSS) öncelikli; ilk dogfood
<1k kullanıcı varsayımı

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Spec-First**: ✅ `specs/002-cozbil-mvp/spec.md` + locked `001`
- **II. Skill-Grounded**: ✅ Plan sources: Spec Kit artifacts; implement
  aşamasında Superpowers TDD/subagent; library/API → Context7 (Gemini,
  Expo, Firebase); product UI → ui-ux-pro-max; ASO/paywall copy →
  marketingskills; pricing sense-check → alirezarezvani if needed
- **III. Test-First**: ✅ tasks.md her US için test-first maddeleri içerir
- **IV. Verified Dependencies**: ✅ Her entegrasyon Context7/resmi doküman
  doğrulaması gerektirir (research.md’de işaretli)
- **V. Role Separation & Simplicity**: ✅ architect (Firebase/Gemini
  pipeline), designer (UI kit), executor (kod), qa-tester, security-reviewer
  (çocuk güvenliği, KVKK akışı). YAGNI: veli raporu/geometri yok
- **Operating Constraints**: ✅ Product type locked (app); taste/transitions
  yalnızca gelecekteki marketing site için

**Post-design re-check**: ✅ Geçer — complexity table boş (ihlal yok)

## Project Structure

### Documentation (this feature)

```text
specs/002-cozbil-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── solve-question.md
│   └── progress.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/mobile/                 # Expo React Native app
├── app/                     # expo-router routes (tabs + stacks)
├── src/
│   ├── components/
│   ├── features/
│   │   ├── onboarding/
│   │   ├── solve/
│   │   ├── history/
│   │   ├── progress/
│   │   ├── paywall/
│   │   └── profile/
│   ├── lib/                 # firebase client, analytics wrappers
│   ├── theme/               # design tokens from designer
│   └── data/                # static LGS / YGS / KPSS topic catalogs
├── assets/
└── tests/

functions/                   # Firebase Cloud Functions
├── src/
│   ├── moderation/
│   ├── solve/
│   ├── cache/
│   ├── quota/
│   └── progress/
└── tests/

firebase/                    # rules, indexes, emulator config
docs/design/                 # UI kit notes (post designer pass)
```

**Structure Decision**: Monorepo-style `apps/mobile` + `functions` keeps
client/server contracts clear for Expo + Firebase MVP without premature
packages abstraction.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
