# Tasks: ÇözBil MVP 1.0

**Input**: Design documents from `/specs/002-cozbil-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required (constitution Test-First / Superpowers TDD)

**Organization**: Tasks grouped by user story for independent delivery

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1…US7

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repo scaffold for Expo mobile + Firebase functions

- [x] T001 Create monorepo dirs `apps/mobile/`, `functions/`, `firebase/` per plan.md
- [x] T002 Initialize Expo TypeScript app in `apps/mobile` with expo-router tabs shell
- [x] T003 [P] Initialize `functions/` TypeScript Firebase Functions project (Node 20)
- [x] T004 [P] Add root/workspace scripts, `.env.example`, and Firebase emulator config in `firebase/`
- [x] T005 [P] Configure Jest + React Native Testing Library in `apps/mobile` and Jest in `functions`
- [x] T006 Theme tokens in `apps/mobile/src/theme/` from moodboard (`#1E1B4B` / `#F59E0B` / Poppins); ui-ux-pro-max CLI N/A → `docs/design/tokens.md`

**Checkpoint**: Empty app boots; emulators start; tests run (empty/pass)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth, rules, static topics, design tokens, shared types — blocks all stories

**⚠️ CRITICAL**: No user story work until this phase completes

- [x] T007 Add Firestore security rules + Storage rules stubs in `firebase/` (deny-by-default, user-scoped paths)
- [x] T008 [P] Implement Firebase Auth email/anonymous-or-social MVP choice in `apps/mobile/src/lib/auth.ts` (verify SDK via Context7)
- [x] T009 [P] Create static math topic catalogs `apps/mobile/src/data/lgs-topics.ts`, `ygs-topics.ts`, `kpss-topics.ts` and mirror types for functions
- [x] T010 [P] Shared DTO types aligning to `contracts/solve-question.md` and `contracts/progress.md` in `functions/src/types/` + mobile `src/lib/api/types.ts`
- [x] T011 Implement user doc bootstrap on first login (`users/{uid}` defaults) in `functions/src/users/`
- [x] T012 [P] Wire expo-image-picker permissions helpers in `apps/mobile/src/features/solve/image.ts` (Context7 Expo docs)
- [x] T013 Security-reviewer pass on rules + child-safety messaging constants (no logging of raw sensitive images beyond Storage paths)

**Checkpoint**: Signed-in user exists in emulator; topics load; theme applied to blank screens

---

## Phase 3: User Story 1 - Fotoğrafla soru çöz (P1) 🎯 MVP

**Goal**: Upload → moderate → dedup → Gemini → stepped solution UI

**Independent Test**: Emulator dogfood with sample math image yields steps; diagram/NSFW rejected without quota burn

### Tests (TDD)

- [x] T014 [P] [US1] Failing unit tests for moderation gate + quota-not-billed on reject in `functions/tests/moderation.test.ts`
- [x] T015 [P] [US1] Failing unit tests for pHash cache hit path in `functions/tests/cache.test.ts`
- [x] T016 [P] [US1] Failing component test for solution steps + transparency note in `apps/mobile/tests/SolutionScreen.test.tsx`

### Implementation

- [x] T017 [US1] Implement SafeSearch moderation module `functions/src/moderation/safeSearch.ts` (Context7 Cloud Vision)
- [x] T018 [US1] Implement pHash + `solutionCache` lookup/write `functions/src/cache/`
- [x] T019 [US1] Implement Gemini Vision solve + topic tag `functions/src/solve/geminiSolve.ts` with exam-aware math prompts (`lgs`/`ygs`/`kpss`) (Context7 Gemini)
- [x] T019b [US1] Loading UI with robot mascot + “Sorun analiz ediliyor…” per moodboard in `apps/mobile/src/features/solve/`
- [x] T020 [US1] Implement callable `solveQuestion` orchestration `functions/src/solve/solveQuestion.ts` matching contract
- [x] T021 [US1] Mobile: camera/gallery capture + upload to Storage `apps/mobile/src/features/solve/`
- [x] T022 [US1] Mobile: loading + result screens (steps, transparency) under `apps/mobile/app/`
- [x] T023 [US1] Unsupported geometry/diagram classifier branch + neutral copy
- [x] T024 [US1] Make T014–T016 pass; qa-tester smoke on Android emulator

**Checkpoint**: US1 independently demoable

---

## Phase 4: User Story 2 - Anlamadım, tekrar açıkla (P1)

**Goal**: Follow-up explanation without burning daily solve quota

**Independent Test**: From a solved attempt, follow-up returns simpler explanation; quota unchanged

### Tests

- [x] T025 [P] [US2] Failing test `functions/tests/explainAgain.test.ts` (quota unchanged, rate limit)
- [x] T026 [P] [US2] Failing UI test button → shows follow-up text

### Implementation

- [x] T027 [US2] Callable `explainAgain` in `functions/src/solve/explainAgain.ts`
- [x] T028 [US2] Wire button + UI on solution screen; persist followUp under user subcollection
- [x] T029 [US2] Increment `topicStats.followUpCount` for weakness signal
- [x] T030 [US2] Pass tests T025–T026

**Checkpoint**: US2 demoable on top of US1

---

## Phase 5: User Story 3 - Onboarding + sınav türü (P2)

**Goal**: 3-screen onboarding; **LGS, YGS, KPSS all selectable**; consent skeleton

**Independent Test**: Fresh install can reach Home via LGS **or** YGS **or** KPSS (none disabled)

### Tests

- [x] T031 [P] [US3] Failing tests for onboarding navigation + all three exam types selectable in `apps/mobile/tests/Onboarding.test.tsx`

### Implementation

- [x] T032 [US3] Onboarding screens 1–3 in `apps/mobile/src/features/onboarding/` (moodboard copy)
- [x] T033 [US3] Persist `examType: lgs|ygs|kpss` + age-appropriate consent timestamp fields
- [x] T034 [US3] Placeholder legal copy + TODO(legal) markers (minor vs adult paths)
- [x] T035 [US3] Pass T031

---

## Phase 6: User Story 4 - Ana sayfa, geçmiş, tab bar (P2)

**Goal**: 4-tab IA, home CTA/streak/recent, history filters

**Independent Test**: Tabs work; history filter by topic

### Tests

- [x] T036 [P] [US4] Failing tests for history filter helper + tab routes

### Implementation

- [x] T037 [US4] expo-router tabs: Home / History / Stats / Profile (moodboard)
- [x] T038 [US4] Home: large orange Fotoğraf Çek CTA, streak, recent attempts
- [x] T039 [US4] History list + subject/topic filters calling `listAttempts`
- [x] T040 [US4] Implement `listAttempts` function + pass T036

---

## Phase 7: User Story 5 - İlerleme, zayıflık, streak (P2)

**Goal**: Progress charts/bars, weakest topic, streak rules (Europe/Istanbul)

**Independent Test**: Seeded stats show weakest topic; streak increments across local days

### Tests

- [x] T041 [P] [US5] Failing unit tests for streak date logic `functions/tests/streak.test.ts`
- [x] T042 [P] [US5] Failing unit tests for weakest-topic selection

### Implementation

- [x] T043 [US5] Maintain `topicStats` on solve/follow-up
- [x] T044 [US5] `getProgressSummary` callable per `contracts/progress.md`
- [x] T045 [US5] Progress UI: bar list + weakest card + weekly series
- [x] T046 [US5] Pass T041–T042

---

## Phase 8: User Story 6 - Freemium + paywall (P2)

**Goal**: Daily 5 free; paywall; subscription entitlement stub/Play Billing

**Independent Test**: 6th solve blocked; active entitlement bypasses

### Tests

- [x] T047 [P] [US6] Failing quota tests `functions/tests/quota.test.ts`
- [x] T048 [P] [US6] Failing paywall screen test

### Implementation

- [x] T049 [US6] Daily quota enforcement in `solveQuestion` (UTC+3 day key)
- [x] T050 [US6] Paywall UI plans (14,90/7g · 39/ay · 349/yıl) `apps/mobile/src/features/paywall/`
- [x] T051 [US6] Subscription entitlement sync stub (Play Billing integration spike + Context7); sandbox path documented in quickstart
- [x] T052 [US6] marketingskills pass for paywall Turkish copy tone
- [x] T053 [US6] Pass T047–T048

---

## Phase 9: User Story 7 - Profil, rate limit, kısıtlama (P3)

**Goal**: Profile, rate limits, invalid-image restriction, delete request flag

**Independent Test**: Burst requests → resource-exhausted; high invalid score → temporary restrict

### Tests

- [x] T054 [P] [US7] Failing tests for rate limit + restriction in `functions/tests/abuse.test.ts`

### Implementation

- [x] T055 [US7] Rate limiting middleware for solve/explain callables (solve wired; explain already has own limit)
- [x] T056 [US7] invalidImageScore updates on moderation rejects; restrict threshold
- [x] T057a [US7] Exam mode switcher (LGS/YGS/KPSS) on home + profile; `updateExamType` callable; stats filter by active exam
- [x] T057 [US7] Profile screen: quota, consent status, sign-out, delete-request flag
- [x] T058 [US7] security-reviewer checklist sign-off for abuse + child messaging (`docs/security/us7-abuse-child-checklist.md`)
- [x] T059 [US7] Pass T054


---

## Phase 10: Polish & Cross-Cutting

- [x] T059b [P] Home: visible **Galeriden Seç** CTA (same upload→SafeSearch→AI pipeline as camera)
- [x] T059c [P] Solve loading UX: staged progress bar (yükleme / güvenlik / çözüm) in `AnalyzingView`
- [x] T060 [P] Math system prompt few-shots per exam in `functions/src/solve/prompts/math/{lgs,ygs,kpss}.ts`
- [x] T061 [P] Turkish subject prompt stubs per exam in `functions/src/solve/prompts/turkish/`
- [ ] T062 App icon assets per brief (navy + amber symbol) in `apps/mobile/assets/`
- [ ] T063 qa-tester full dogfood path from `quickstart.md` + write results to sprint report
- [ ] T064 Update `README.md` / `AGENTS.md` active feature pointers if needed
- [ ] T065 Verification-before-completion: all SC-001–SC-006 evidence noted

### Mini item bank (MVP 1.0 — telifsiz)

> Mimari: `docs/architecture/item-bank.md`. Kitapçık/PDF/dershane kopyası yok.

- [x] T066 [P] Architecture + schema + seed skeleton in `content/item-bank/` + `docs/architecture/item-bank.md`
- [ ] T067 Fill MVP mini pack to ~50–60 original items (LGS/YGS/KPSS math-first) with answer keys + explanationSteps; update `manifests/mvp-1.0.json`
- [x] T068 Wire 1–2 bank items per exam into solve few-shot prompts (T060); keep `source: original` only — `prompts/fewshots.ts`
- [x] T069 [P] Optional light UI “Örnek soru” from manifest (not full practice session) — tab **Konular** + `app/sample/[id]` + bundled seed
- [ ] T070 Guardian pass: no copyrighted stems; similarityCheck=pass on all manifest ids

---

## Dependencies

```text
Phase 1 → Phase 2 → US1 → US2
                 ↘ US3 (can parallel after Phase 2)
US1 → US4 (history needs attempts)
US1 + US2 → US5 (stats)
US1 → US6 (quota on solve)
Phase 2 → US7 (can parallel after US1 moderation signals exist)
```

## Parallel opportunities

- After Phase 2: designer theme (T006 done) + architect functions types
- US3 onboarding // US1 solve backend (different files)
- Prompt polish T060/T061 // paywall copy T052

## Implementation strategy

1. Ship US1+US2 first (core loop)
2. Add US3+US4 for navigable product feel
3. US5 differentiates “weakness” positioning
4. US6 monetization gate before store
5. US7 harden abuse/privacy

## MVP slice suggestion

Minimum lovable demo: Phase 1–4 (Setup, Foundation, US1, US2) + stub tabs.
