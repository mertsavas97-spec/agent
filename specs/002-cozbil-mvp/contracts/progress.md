# Contract: Progress & History

## `getProgressSummary`

### Response

```json
{
  "streakCount": 3,
  "weakestTopic": { "topicId": "math-uslu-sayilar", "nameTr": "Üslü Sayılar", "followUpCount": 4 },
  "topics": [
    { "topicId": "math-kesirler", "nameTr": "Kesirler", "attemptCount": 10, "followUpCount": 1 }
  ],
  "weekly": [
    { "date": "2026-07-12", "solvedCount": 2 },
    { "date": "2026-07-13", "solvedCount": 5 }
  ]
}
```

## `listAttempts`

### Request

```json
{
  "subject": "math",
  "topicId": "math-kesirler",
  "limit": 20,
  "cursor": null
}
```

Filters optional.

### Response

```json
{
  "items": [
    {
      "attemptId": "string",
      "createdAt": "ISO-8601",
      "subject": "math",
      "topicId": "math-kesirler",
      "status": "solved",
      "thumbnailUrl": "https://..."
    }
  ],
  "nextCursor": "string|null"
}
```
