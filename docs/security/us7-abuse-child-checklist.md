# Security review — US7 abuse + child messaging (T058)

**Reviewer role:** security-reviewer  
**Date:** 2026-07-18  
**Scope:** Rate limit, invalid-image restrict, profile delete flag, LGS/child consent messaging

## Checklist

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | Solve rate limit returns `resource-exhausted` with neutral TR copy | PASS | `assertRateLimit` in `solveQuestion` |
| 2 | High `invalidImageScore` → temporary restrict (30m) | PASS | Threshold 8; no shaming copy |
| 3 | Moderation reject messages remain neutral | PASS | Existing `SAFETY_MESSAGES` |
| 4 | LGS / minor path uses parental consent fields | PASS | Onboarding + profile consent label |
| 5 | Adult YGS/KPSS uses standard consent label | PASS | Profile `consentLabel` |
| 6 | Delete request is soft-flag only (no client hard-delete of others’ data) | PASS | `deleteRequestedAt` via callable |
| 7 | Sign-out clears auth; BootstrapGate re-checks onboarding | PASS | `subscribeAuth` + uid dependency |
| 8 | No secrets in mobile / profile UI | PASS | Quota/consent from user doc only |
| 9 | Exam switch does not expose other users’ data | PASS | Own `users/{uid}` only |
| 10 | Legal KVKK body still counsel-pending | ACCEPT | `TODO(legal)` in onboarding copy |

## Residual risks

- In-memory rate limit is per Functions instance (not global); acceptable MVP.
- Hard purge of Storage/Firestore after `deleteRequestedAt` is ops backlog.
- AdMob child-directed flags still pending when ads SDK is wired.

## Verdict

**PASS** for US7 abuse + child messaging checkpoint — proceed to Polish (T060+) with same constraints.
