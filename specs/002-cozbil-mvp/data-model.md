# Data Model: ÇözBil MVP 1.0

**Date**: 2026-07-18

## Collections (Firestore)

### `users/{uid}`

| Field | Type | Notes |
|-------|------|-------|
| displayName | string | optional |
| examType | `"lgs" \| "ygs" \| "kpss"` | All three active in MVP |
| birthYear or ageBand | number / enum | consent routing |
| parentalConsentAt | timestamp \| null | |
| streakCount | number | |
| streakLastActiveDate | string `YYYY-MM-DD` (Europe/Istanbul) | |
| dailySolveCount | number | reset on local day change |
| dailySolveDate | string `YYYY-MM-DD` | |
| subscriptionStatus | `"free" \| "active" \| "grace" \| "expired"` | |
| invalidImageScore | number | abuse signal |
| restrictedUntil | timestamp \| null | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### `users/{uid}/attempts/{attemptId}`

| Field | Type | Notes |
|-------|------|-------|
| imagePath | string | Storage path |
| phash | string | for dedup |
| status | enum | `pending_moderation`, `rejected_moderation`, `rejected_not_question`, `unsupported_type`, `solving`, `solved`, `failed` |
| subject | `"math" \| "turkish" \| "unknown"` | |
| topicId | string \| null | FK to catalog |
| moderationLabels | map | SafeSearch summary |
| solutionId | string \| null | |
| billed | boolean | quota consumed? |
| createdAt | timestamp | |

### `users/{uid}/solutions/{solutionId}`

| Field | Type | Notes |
|-------|------|-------|
| attemptId | string | |
| steps | array<{ title?: string, body: string }> | |
| rawModelMeta | map | model/version, prompt key — no secrets |
| transparencyNoteShown | boolean | always true for UI |
| createdAt | timestamp | |

### `users/{uid}/followUps/{followUpId}`

| Field | Type | Notes |
|-------|------|-------|
| solutionId | string | |
| explanation | string | |
| createdAt | timestamp | |

### `solutionCache/{cacheKey}`

| Field | Type | Notes |
|-------|------|-------|
| phash | string | |
| topicId | string \| null | |
| steps | array | denormalized for fast return |
| hitCount | number | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

Global cache entries MUST NOT include other users’ PII; only solution text + topic.

### `topicStats/{uid}/topics/{topicId}`

| Field | Type | Notes |
|-------|------|-------|
| attemptCount | number | |
| solvedCount | number | |
| followUpCount | number | weakness signal |
| lastAttemptAt | timestamp | |

## Static catalog (not Firestore)

`Topic`: `{ id, examType, subject, nameTr, gradeBand? }` in repo data files
per exam, e.g. `lgs-topics.ts`, `ygs-topics.ts`, `kpss-topics.ts`.

## State transitions (Attempt)

```text
pending_moderation
  → rejected_moderation
  → rejected_not_question
  → unsupported_type
  → solving → solved
  → solving → failed
```

Quota (`billed=true`) only when transitioning to `solved` for a new
non-cache-billed policy: cache hits still count as a “solve” for streak
and history but MAY or MAY NOT consume daily free quota — **Decision**:
cache hits **do consume** free daily quota (anti-refresh abuse) but are
free of AI cost. Follow-ups never set `billed` on the parent attempt.

## Validation rules

- `examType` MUST be one of `lgs` | `ygs` | `kpss` in MVP writes.
- `steps` MUST be non-empty when status is `solved`.
- `restrictedUntil` in future → solve callable returns 429-equivalent.
- Soft-delete / export hooks: document in privacy design; implement
  minimal delete-request flag on user profile in MVP.
