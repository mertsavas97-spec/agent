# Sınav türü pipeline durumu (LGS / YGS / KPSS)

## Kurulu olanlar

| Katman | Durum |
|--------|--------|
| Onboarding’de sınav seçimi | ✅ `completeOnboarding` → `users.examType` |
| Solve pipeline | ✅ SafeSearch → phash cache → Gemini/Vertex (`mathSystemPrompt(examType)`) → Firestore attempt |
| Explain again | ✅ `explainAgainPrompt(examType)` |
| Konu katalogları | ✅ Ayrı listeler: `lgs` / `ygs` / `kpss` (mobil + functions mirror) |
| Cache anahtarı | ✅ phash **+** examType (aynı foto farklı sınavda ayrı cache) |
| Uygulama içi sınav değiştirme | ✅ `updateExamType` + `ExamModeSwitcher` (US7) |

## Henüz ince ayar (Polish)

- T060: matematik few-shot’ları sınav dosyalarına ayırma
- T061: Türkçe subject prompt’ları
- Item bank few-shot bağlama (T068)
- Katalog uzman doğrulaması (geniş müfredat değil, MVP iskelet)

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
