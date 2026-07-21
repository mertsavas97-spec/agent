# Sprint 1 — Scope + Pricing SSoT

**Date:** 2026-07-21  
**Status:** Approved (owner)  
**Branch:** `cursor/mvp-10-launch-audit-9131`  
**Source audit:** PS-01, PS-02 in `docs/audits/mvp-1.0-launch-ready-audit-2026-07-20.md`

## Decisions

| Topic | Lock |
|-------|------|
| Weekly Premium | 14,90 TL / 7 gün |
| Monthly Premium | 39 TL / ay |
| Yearly Premium | **279 TL / yıl** (~%40 vs 12×39) |
| MVP 1.0 exams | **LGS · YGS · KPSS · Ehliyet (trafik)** |
| Pricing SSoT | `docs/product/pricing-policy.md` ↔ `apps/mobile/src/features/paywall/pricing.ts` |
| Scope SSoT | `PROJECT_BRIEF.md` + `specs/002-cozbil-mvp/spec.md` + constitution |

## Rationale

- **279:** Policy + code + Play SKU docs already aligned (2026-07-20); brief/spec were stale at 349.
- **Ehliyet in MVP:** Full pipeline already shipped; owner chose to promote into official MVP scope and store copy rather than hide or defer.

## In scope (this sprint)

1. Replace product-facing **349** with **279** (spec, briefs, README, quickstart, research, tasks notes, listing draft, sprint state).
2. Update exam scope language from 3 exams → **4** (LGS/YGS/KPSS/Ehliyet) in brief, spec, constitution, marketing, store draft, AGENTS/README where it claims MVP scope.
3. Mark Play checklist P1 items for pricing/scope as decided.
4. Add short note on audit PS-01/PS-02 resolution; sprint report + SPRINT_STATE.

## Out of scope

- IAP / server entitlement (Sprint 2)
- KVKK URLs / guardian UX (Sprint 3)
- EAS / listing screenshots (Sprint 4)
- Production solve path (Sprint 5)
- Removing or rewriting Ehliyet runtime code (already correct)
- Changing `pricing.ts` values (already 279)

## Success criteria

- Product docs no longer claim 349 TL/yıl.
- MVP exam list consistently includes Ehliyet.
- `pricing.test.ts` still PASS (279).
- Guardian: no “yalnız 3 sınav” / stale price in active product surfaces.
- QA Gate: typecheck N/A or PASS for touched TS; smoke = grep + test pricing.

## Spec self-review

- [x] No TBD placeholders for the two locks
- [x] No 349 vs 279 ambiguity after apply
- [x] Scope includes store copy implication
- [x] Size appropriate for docs-only SSoT sprint
