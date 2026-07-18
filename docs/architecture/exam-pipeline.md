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

## Hangi sınavda hangi dersler (MVP katalog)

Her sınavda öncelik **matematik**; ikinci dalga **Türkçe**. Diğer dersler (fen, sosyal, GY/GK geniş) MVP dışı.

### LGS
- Mat: Kesirler, Üslü, Köklü, Oran Orantı, Yüzdeler, Denklemler, Olasılık, Veri Analizi  
- Türkçe: Sözcükte Anlam, Paragraf  

### YGS (YKS hattı etiketi)
- Mat: Temel Kavramlar, Sayılar, Bölünebilme, Faktöriyel, Denklemler, Eşitsizlikler, Fonksiyonlar, Trigonometri  
- Türkçe: Anlam Bilgisi, Paragraf  

### KPSS
- Mat: Temel İşlemler, Kesirler, Yüzde, Oran Orantı, Problemler, Temel Geometri (metin), Tablo/Grafik  
- Türkçe: Dil Bilgisi, Anlam Bilgisi, Paragraf  

Kaynak kod: `apps/mobile/src/data/*-topics.ts`, `functions/src/data/topics.ts`.

## Değiştirince ne olur?

1. `users.examType` güncellenir.  
2. Sonraki `solveQuestion` kullanıcı dokümanından yeni türü okur → prompt + topicId uzayı değişir.  
3. Geçmiş attempt’ler **silinmez** (eski examType ile kalır).  
4. İstatistik / zayıf konu listesi **aktif sınavın** `topicId` önekine göre süzülür.
