# Sınav türü pipeline durumu (LGS / YGS / KPSS)

## Kurulu olanlar

| Katman | Durum |
|--------|--------|
| Onboarding’de sınav seçimi | ✅ `completeOnboarding` → `users.examType` |
| Solve pipeline | ✅ SafeSearch → phash cache → Vertex (`systemPromptForSolve`) → clamp → Firestore |
| Fail-closed Vision / demo cloud | ✅ `assertVisionConfiguredForLive` + `assertDemoAiAllowedInRuntime` |
| Stub cache poison | ✅ demo/stub `writeCacheEnabled=false` |
| Rate limit | ✅ in-memory + Firestore `rateLimits` |
| Explain again | ✅ `explainAgainPrompt(examType, subject)` |
| Konu katalogları | ✅ Ders ağacı 2020–2026 (subject → topic) |
| Cache anahtarı | ✅ phash **+** examType |
| Item-bank few-shot (T068) | ✅ math + turkish subject-aware |
| Teacher router | ✅ `teacherLineForSubject` |
| Mobil subjectHint | ✅ Konular → store → Home → solve |
| Firestore kota/abuse kilidi | ✅ client update yasak |
| Uygulama içi sınav değiştirme | ✅ `updateExamType` + `ExamModeSwitcher` (US7) |

## Açık (audit P2)

- T061 Türkçe prompt derinliği · T067 banka hacmi · Functions IAM · eval harness

## Hangi sınavda hangi dersler (2020–2026 oturum ağacı)

Tam brifing: **`docs/architecture/EXAM_SUBJECT_TREE_2020_2026.md`**

| Sınav | Alt ders (subject) |
|-------|--------------------|
| LGS | turkish, math, science, history, religion, english |
| YGS (=YKS TYT/AYT) | turkish, literature, math, physics, chemistry, biology, history, geography, philosophy, religion |
| KPSS GY–GK | turkish, math, geometry, history, geography, civics, current |

Konu katalogları: `apps/mobile/src/data/*-topics.ts` + `functions/src/data/topics.ts`  
AI: `systemPromptForSolve(examType, subjectHint)` + `clampTopicId`

## Değiştirince ne olur?

1. `users.examType` güncellenir.  
2. Sonraki `solveQuestion` kullanıcı dokümanından yeni türü okur → prompt + topicId uzayı değişir.  
3. Geçmiş attempt’ler **silinmez** (eski examType ile kalır).  
4. İstatistik / zayıf konu listesi **aktif sınavın** `topicId` önekine göre süzülür.
