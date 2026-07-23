# Pipeline & AI Audit — 2026-07-19 (güncel)

**Koordinatör + ekipler:** architect · backend/AI · security-reviewer · guardian  
**Skills:** `cozbil-team-skills`, subject tree `EXAM_SUBJECT_TREE_2020_2026.md`, `cozbil-guardian`  
**Kapsam:** `solveQuestion` + `explainAgain` + subject-aware prompts + moderation/quota/cache

---

## Özet karar (güncel)

| Alan | MVP dogfood (kapalı) | Public Play |
|------|----------------------|-------------|
| **Pipeline** | **Evet** (P0 + persistent RL) | Hayır (IAM org + eval hacmi) |
| **AI kalitesi** | Borderline↑ (ders router + few-shot + JSON repair) | Hayır (eval ~50–60) |
| **Güvenlik / abuse** | Dogfood OK (Vision fail-closed + rules + Firestore RL) | Hayır (IAM) |

**Tek cümle:** Ders ağacı bakışı pipeline’a işlendi; dogfood için güvenilir. Mağaza için Functions IAM + eval hacmi kaldı.

---

## 1) Pipeline as-is (subject-aware)

1. Auth + path  
2. **In-memory + Firestore persistent rate limit** (`rateLimits/{key}`)  
3. Soft restrict (invalidImageScore)  
4. **assertDemoAiAllowedInRuntime** / **assertVisionConfiguredForLive**  
5. Kota  
6. SafeSearch (key yoksa live’da fail-closed)  
7. phash + examType cache (**demo/stub yazmaz**)  
8. `subjectHint` exam-katalog validate → `teacherLineForSubject` + `itemBankFewShot(exam, subject)` + JSON repair/1 retry  
9. `clampTopicId` + subject enum (LGS/YGS/KPSS dersleri)  
10. Persist  
11. explainAgain (subject-aware teacher)

**Mobil:** Konular → “Bu dersten soru çek” → `subjectHintStore` → Home kamera/galeri → `solveQuestion({ examType, subjectHint })`.

---

## 2) Bu turda kapanan audit maddeleri

| # | Madde | Durum |
|---|--------|--------|
| 1 | Fail-closed Vision + demo cloud hard-fail + stub cache yok | **Done** |
| 2 | Firestore server-owned alan kilidi | **Done** |
| 3 | JSON repair + 1 retry | **Done** |
| 4 | topicId katalog clamp | **Done** |
| 5 | Item-bank few-shot (T068) + Türkçe few-shot | **Done** |
| 7 | Persistent rate limit (Firestore) | **Done** |
| 10 | Subject-aware prompt (ders ağacı + teacher router) | **Done** |
| 11 | Mobil subjectHint köprüsü (Konular → solve) | **Done** |

---

## 3) Hâlâ açık

| # | Madde | Not |
|---|--------|-----|
| 6 | Eval harness (~50–60 madde) | Seed 3; T067 açık |
| 8 | Functions IAM org exception | Owner |
| 9 | Item bank hacim (diğer dersler) | Product / T067 |
| 12 | T061 Türkçe-only prompt derinliği | Stub + few-shot var; genişletme |

---

## 4) Env bayrakları (ops)

| Flag | Anlam |
|------|--------|
| `COZBIL_USE_VERTEX=1` | Live Vertex (tercih) |
| `COZBIL_DEMO_AI=1` | Stub AI — **cloud’da default yasak** |
| `COZBIL_ALLOW_DEMO_IN_PROD=1` | Cloud’da demo’ya izin (sadece bilinçli) |
| `GOOGLE_CLOUD_VISION_API_KEY` | Live SafeSearch zorunlu |
| `COZBIL_ALLOW_OPEN_VISION=1` | Vision’siz allow-all (yalnız debug) |

---

## 5) Guardian
- Telifli çıkmış soru yok; few-shot’lar özgün item-bank.  
- “%100 doğru” yok; şeffaflık notu duruyor.  
- Diyagram-ağır → `unsupported` yolu aynı.

---

## 6) Kaynak
- `functions/src/config/runtime.ts`, `moderation/visionClient.ts`  
- `functions/src/abuse/{rateLimit,persistentRateLimit}.ts`  
- `functions/src/solve/{prompts,subjectTeacher,fewshots,parseSolution,geminiSolve,solveQuestion}.ts`  
- `apps/mobile/src/features/solve/subjectHintStore.ts`  
- `firebase/firestore.rules`  
- `docs/architecture/EXAM_SUBJECT_TREE_2020_2026.md`
