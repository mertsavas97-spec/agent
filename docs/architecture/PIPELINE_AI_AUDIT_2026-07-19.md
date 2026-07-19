# Pipeline & AI Audit — 2026-07-19

**Koordinatör:** audit only (UI polish durduruldu)  
**Ekipler:** architect · backend/AI · security-reviewer · guardian  
**Skills:** `cozbil-team-skills`, `cozbil-expo-mobile` (client boundary), `cozbil-guardian`, `senior-fullstack` (code review via explore), roles `architect` / `security-reviewer`  
**Kapsam:** `solveQuestion` + `explainAgain` + prompts/Vertex + moderation/quota/abuse/cache

---

## Özet karar

| Alan | MVP dogfood (kapalı) | Public Play |
|------|----------------------|-------------|
| **Pipeline (orkestrasyon)** | Borderline → **evet, dikkatli** | Hayır (IAM + rules) |
| **AI kalitesi** | Borderline → **yalnızca Vertex live + bilinçli beklenti** | Hayır (eval yok) |
| **Güvenlik / abuse** | Dogfood OK (Vision key şart) | Hayır |

**Tek cümle:** Mimari iskelet MVP için doğru kurulmuş; kalite ve güvenlik kapıları henüz “ürün” seviyesinde değil. Kapalı dogfood için yeterli; mağaza / geniş kullanıcı için güçlendirme şart.

---

## 1) Pipeline as-is

`functions/src/index.ts` → `runSolveQuestion` (`solve/solveQuestion.ts`):

1. Auth + `users/{uid}/…` path  
2. Rate limit (`abuse/rateLimit.ts`) + soft restrict (`invalidImageScore`)  
3. Günlük kota (`quota/dailyQuota.ts`, free 5)  
4. Storage’dan görsel indir  
5. SafeSearch (`moderation/*`) — reject → kota yanmaz  
6. phash + `examType` cache (`cache/*`)  
7. Gemini/Vertex solve (`geminiSolve.ts` + `mathSystemPrompt(examType)`)  
8. Parse / unsupported gate (`parseSolution.ts`)  
9. Persist attempt + solution + streak + topicStats  
10. `explainAgain` ayrı callable (kota yakmaz, kendi RL)

Doküman uyumu: `docs/architecture/exam-pipeline.md`, `exam-ai-strategy.md`.

---

## 2) Güçlü yanlar (MVP)

- Sınav ayrımı: prompt + cache key + istatistik prefix (`lgs`/`ygs`/`kpss`)  
- Moderation reject’te kota yanmaması (ürün/SC uyumu)  
- Transparency notu her başarıda  
- Storage owner path + attempts client-write kapalı  
- Vertex / Studio / demo fallback bilinçli ayrılmış  
- 120s / 512MB callable — SC-001 latency zarfına uygun  

Guardian: “%100 doğru” iddiası yok; şeffaflık metni doğru yönde.

---

## 3) Boşluklar / riskler

### AI / kalite
- Few-shot’lar oyuncak aritmetik; item-bank seed **bağlı değil** (T068 açık)  
- Canlı path **yalnız matematik**; Türkçe prompt stub, solver kullanmıyor  
- `topicId` kataloga clamp edilmiyor → çöp etiket / stats kirlenmesi  
- Model JSON parse kırılgan (`JSON.parse`, retry/schema yok)  
- Eval harness yok → SC-001 iddiası ölçülemez  
- Demo/stub yanlış env’de “sahte çözüm” üretebilir; cache’e yazılırsa zehirlenir  

### Pipeline / reliability
- Vision key yoksa **fail-open** (`visionClient.ts`) — çocuk güvenliği sessizce kapanır  
- In-memory rate limit — multi-instance’da zayıf (maliyet bombası)  
- Kota alanı client update ile oynanabilir (`firestore.rules` allow list)  
- phash = byte sample hash; gerçek perceptual hash değil; yine de exact-key OK  
- Functions `europe-west1` vs Vertex `us-central1` — latency/cost  

### Platform
- Org policy `allUsers` invoker engeli → callables 401; client Firestore fallback güvenlik modelini zayıflatır  

---

## 4) Verdict detay

### Pipeline: **Borderline / dogfood-evet**
Orkestrasyon sırası, sınav anahtarı, kota/moderation ürün kuralları doğru. Eksikler: fail-closed moderation, kalıcı RL, rules kilidi, IAM.

### AI: **Borderline / dogfood-koşullu**
Vertex live + bilinen matematik fotoğrafları ile demo alınır. “Akıllı sınav arkadaşı” hissi için few-shot + eval + parse sağlamlığı şart. Public kalite iddiası için henüz erken.

---

## 5) Güçlendirme planı (öncelik)

| # | Aksiyon | Etki | Efor | Sahip ekip |
|---|---------|------|------|------------|
| 1 | **Fail-closed live:** Vision key yoksa solve reddet; stub çıktıyı cache’leme; demo mode’u prod’da hard-fail | Yüksek | S | backend + security |
| 2 | **Firestore rules:** `dailySolveCount`, `invalidImageScore`, `restrictedUntil`, consent alanlarını client update’ten çıkar | Yüksek | S | security |
| 3 | **JSON schema + 1 retry** (Vertex `responseMimeType`/`responseSchema` veya parse repair) | Yüksek | S–M | backend/AI |
| 4 | **`topicId` katalog clamp** persist öncesi | Yüksek | S | architect + backend |
| 5 | **Item-bank few-shot** 1–2/sınav (T068) + toy shot’ları kaldır | Orta–Yüksek | M | backend + product |
| 6 | **Eval harness** `manifests/mvp-1.0.json` (schema valid, topic prefix, latency, answerKey spot-check) | Yüksek | M | qa + backend |
| 7 | **Persistent rate limit** (Firestore) + günlük Vision/Gemini spend cap | Orta | M | security + backend |
| 8 | **Functions IAM** org exception / authenticated invoke — client güvenlik fallback’lerini daralt | Yüksek (platform) | M (org) | architect + owner |
| 9 | Item bank hacim ~50–60 (T067) — few-shot + eval yakıtı | Orta | L | product |
| 10 | Türkçe subject live path (T061 sonrası) | Orta (kapsam) | M | backend |

### Önerilen sprint dilimleri
1. **P0 (1 oturum):** #1 #2 #4  
2. **P1:** #3 #5 #6  
3. **P2 / launch gate:** #7 #8 #9  

---

## 6) Guardian notu
- Mağaza metninde “her soruyu doğru çözer” yok.  
- Geometry render / veli raporu / full pratik session hâlâ post-MVP.  
- Konular tab’ındaki örnekler “örnek anlatım” — AI live kalitesinin yerine geçmez.

---

## 7) Kaynak dosyalar
- `functions/src/solve/solveQuestion.ts`, `geminiSolve.ts`, `prompts/**`, `parseSolution.ts`  
- `functions/src/moderation/visionClient.ts`, `abuse/rateLimit.ts`, `quota/dailyQuota.ts`  
- `firebase/firestore.rules`, `docs/architecture/exam-pipeline.md`  
- `content/item-bank/`, `specs/002-cozbil-mvp/tasks.md` (T067–T070)
