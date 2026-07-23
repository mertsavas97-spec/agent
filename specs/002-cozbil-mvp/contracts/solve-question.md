# Contract: Solve Question Pipeline

**Service**: Firebase Callable / HTTPS Function `solveQuestion`  
**Consumer**: `apps/mobile` solve feature  
**Verify APIs with Context7 before implementation**

## `solveQuestion`

### Request

```json
{
  "imagePath": "users/{uid}/uploads/{id}.jpg",
  "subjectHint": "math",
  "examType": "lgs"
}
```

`subjectHint` optional (`math` \| `turkish`).  
`examType` optional override; default = `users/{uid}.examType` (`lgs` \| `ygs` \| `kpss`).

### Response — success

```json
{
  "attemptId": "string",
  "solutionId": "string",
  "status": "solved",
  "cached": false,
  "topicId": "math-kesirler",
  "subject": "math",
  "answer": { "label": "B", "text": "3" },
  "steps": [
    { "title": "1. Adım", "body": "..." }
  ],
  "transparencyNote": "AI tarafından üretilmiştir, kontrol etmeni öneririz.",
  "quota": { "remainingToday": 4, "unlimited": false }
}
```

`status="solved"` için `answer.text` zorunludur. Nihai cevap üretilemeyen
çıktı `unsupported_type` veya hata olarak dönmelidir; jenerik ipucu adımları
`solved` kabul edilmez.

### Response — rejected / unsupported

```json
{
  "attemptId": "string",
  "status": "rejected_moderation" | "rejected_not_question" | "unsupported_type",
  "userMessage": "Bu görselde bir soru tespit edemedik, lütfen net bir soru fotoğrafı çekin",
  "quota": { "remainingToday": 5, "unlimited": false }
}
```

`userMessage` MUST be neutral; MUST NOT moralize.

### Errors

| Code | When |
|------|------|
| `unauthenticated` | no auth |
| `resource-exhausted` | daily quota or rate limit |
| `failed-precondition` | account restricted |
| `invalid-argument` | missing imagePath |
| `internal` | model/storage failure after retries |

## `explainAgain`

### Request

```json
{ "solutionId": "string" }
```

### Response

```json
{
  "followUpId": "string",
  "explanation": "string"
}
```

Does not decrement daily solve quota; subject to separate rate limit.
