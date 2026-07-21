# Sprint 1 Implementation Plan — Scope + Pricing SSoT

> **For agentic workers:** Docs/spec alignment only. Pricing code already correct.

**Goal:** Lock yearly price at **279 TL** and MVP exams at **LGS · YGS · KPSS · Ehliyet** across product SSoT docs.

**Architecture:** No runtime change. Canonical runtime pricing remains `pricing.ts` ↔ `pricing-policy.md`. Spec/brief/constitution catch up.

**Tech stack:** Markdown product docs + one test description rename.

---

### Task 1: Product briefs + PROJECT_BRIEF

**Files:** `PROJECT_BRIEF.md`, `docs/product/cozbil-mvp-1.0-brief.md`, `.agents/product-marketing.md`

- Add Ehliyet to MVP exam list
- Replace 349 → 279 where present

### Task 2: Spec Kit + constitution

**Files:** `specs/002-cozbil-mvp/spec.md`, `plan.md`, `research.md`, `quickstart.md`, `tasks.md` (T050 note), `.specify/memory/constitution.md`

- Exam scope + pricing assumptions
- FR-013 / SC-003 / SC-006 include Ehliyet
- StudentAccount examType includes `trafik`

### Task 3: Store / README / state / audit note

**Files:** `README.md`, `AGENTS.md`, `docs/store/listing-copy-draft-tr.md`, `docs/store/play-launch-checklist.md`, `SPRINT_STATE.md`, audit PS rows note, sprint report

### Task 4: QA Gate

- `npx tsc` / pricing test if mobile scripts available
- Grep product paths for `349`
- Rename theme test title if needed
- Write `docs/sprint-reports/2026-07-21-sprint1-scope-pricing-ssot.md`
