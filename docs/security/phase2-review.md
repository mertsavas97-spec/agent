# Security review — Phase 2 foundation (T013)

**Reviewer role:** security-reviewer  
**Date:** 2026-07-18  
**Scope:** Firestore/Storage rules, auth bootstrap, logging, child-safe copy

## Findings

| Area | Status | Notes |
|------|--------|-------|
| Firestore deny-by-default + user paths | PASS | Attempts/solutions write = false (Functions only) |
| Storage user uploads | PASS | auth + image/* + 8MB; other paths denied |
| Client Gemini keys | PASS | None in mobile; server-only later |
| Logging | PASS | `LOGGING_POLICY.allowImageBytesInLogs = false` |
| Moderation copy | PASS | Neutral; no shaming (`safetyMessages`) |
| Exam scope | PASS | Rules require `lgs\|ygs\|kpss` |

## Residual risks (accepted for Phase 2)

- Emulator/demo Firebase config allows local dev without real keys
- Parental consent fields exist; legal copy still TODO(legal)
- Rules not yet emulator-tested in CI

## Verdict

**PASS** for Phase 2 checkpoint — proceed to US1 with same logging/copy constraints.
