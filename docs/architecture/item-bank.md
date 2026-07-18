# Özgün soru–cevap–anlatım arşivi (Item Bank)

> Owner kararı (2026-07-18): **MVP 1.0’da mini arşiv hazır**; sonraki
> sürümlerde büyütülür. Telifli YGS/LYS/KPSS kitapçığı, PDF, site veya
> dershane bankası **kopyalanmaz**. Bu kaynaklar yalnızca **tarz / ölçek /
> yaklaşım referansı**dır.

İlgili: `docs/architecture/exam-ai-strategy.md` · `specs/002-cozbil-mvp/`

---

## 1) Ne düşünüyoruz? (koordinatör özeti)

Bu yaklaşım **doğru ve önerilen yol**:

| İlke | Açıklama |
|------|----------|
| Mini ama hazır | 1.0’da küçük, kaliteli, şeması oturmuş paket |
| Büyütülebilir | 1.1 / 1.2’de konu başı hacim artar; şema değişmez |
| Telifsiz | Her madde `source: original`, `license: owned` |
| Sınav ölçeğinde | Zorluk, şık yapısı, dil; **metin birebir değil** |
| Üç hat | `lgs` · `ygs` (LYS/YKS ailesi) · `kpss` |

**LYS notu:** Ürün etiketi owner kararıyla **YGS**. Eski LYS konu/tarz
beklentisi `examType: ygs` kataloğu + item bank `track: ygs` altında tutulur.

---

## 2) Hukuk çizgisi (kesin)

### Yasak (red)

- Geçmiş ÖSYM / MEB kitapçığından soru metni veya görsel almak  
- Dershane PDF / site / “soru bankası” scrape veya OCR  
- Bilinen bir soruyu “sadece sayıları değiştirerek” türetmek  
- Telifli çözüm videosu / PDF anlatımını aynen aktarmak  

### İzinli referans (ok)

- Resmi kılavuzdaki **konu başlıkları** (zaten topic catalog)  
- Genel sınav **formatı**: 5 şık, işlem süresi hissi, dil seviyesi  
- “Bu konuda genelde ne tür beceriler ölçülür?” bilgisi (müfredat)  
- Kendi yazarlarımızın / editörümüzün **sıfırdan** yazdığı madde  

> Referans = ilham / kalibrasyon. Kaynak metin asla repo’ya girmez.
> Şüphede: maddeyi yeniden yaz veya at.

Bu belge hukuki danışmanlık değildir; store öncesi counsel onayı ayrıdır.

---

## 3) MVP 1.0 kapsamı (mini arşiv)

### Hedef hacim (1.0 “hazır”)

| Sınav | Matematik (öncelik) | Türkçe (iskelet) | Toplam ~ |
|-------|---------------------|------------------|----------|
| LGS   | 12–15               | 3–5              | ~18      |
| YGS   | 12–15               | 3–5              | ~18      |
| KPSS  | 12–15               | 3–5              | ~18      |

**1.0 taban: ~50–60 madde** (konu kataloğundaki ana başlıklara yayılmış).  
Kalite > hacim. Her maddede soru + doğru anahtar + adım adım anlatım zorunlu.

### 1.0’da ürün kullanımı

1. **Eval / dogfood** — Gemini live geçişte SC-001 örnek seti  
2. **Few-shot** — `prompts` içine seçilmiş 1–2 örnek (metin)  
3. **İç demo** — screenshot / yatırımcı / owner turu  
4. **İsteğe bağlı hafif UI** — “Örnek soru” (tek madde); tam pratik session değil  

### 1.0 dışı (bilinçli erteleme)

- Zayıf konudan otomatik pratik session (spec 1.2)  
- Binlerce maddelik banka  
- Spaced repetition  

Şema ve klasör yapısı 1.2 büyümesi için **şimdiden** kilitlenir.

---

## 4) Madde şeması (tek kaynak gerçek)

Dosya konumu (öneri):

```text
content/item-bank/
  README.md
  schema.json
  lgs/
    math/*.json
    turkish/*.json
  ygs/
    math/*.json
    turkish/*.json
  kpss/
    math/*.json
    turkish/*.json
  manifests/
    mvp-1.0.json          # hangi id’ler 1.0 paketinde
```

### JSON alanları

```json
{
  "id": "ygs-math-denklemler-001",
  "examType": "ygs",
  "subject": "math",
  "topicId": "ygs-math-denklemler",
  "difficulty": "mid",
  "format": "multiple_choice",
  "stem": "Soru kökü (özgün Türkçe)…",
  "choices": { "A": "…", "B": "…", "C": "…", "D": "…", "E": "…" },
  "answerKey": "C",
  "explanationSteps": [
    { "title": "1. Adım", "body": "…" },
    { "title": "2. Adım", "body": "…" }
  ],
  "transparencyNote": "AI tarafından üretilmiştir, kontrol etmeni öneririz.",
  "source": "original",
  "license": "owned",
  "styleRefNote": "YGS tarzı denklem; hiçbir kitapçık metni kullanılmadı",
  "review": {
    "author": "editor-id",
    "reviewedAt": "2026-07-18",
    "similarityCheck": "pass"
  },
  "version": 1
}
```

Kurallar:

- `source` her zaman `"original"`  
- `license` her zaman `"owned"` (veya ileride açık lisans etiketi)  
- `topicId` mevcut katalogla birebir  
- `similarityCheck: pass` olmadan manifest’e alınmaz  

---

## 5) Üretim hattı (tarz referansı → özgün madde)

```text
1. Topic seç (catalog)
2. Tarz kalibrasyonu (insan): "bu konuda sınavda hangi beceri?"
   — kitapçık/PDF metni kopyalanmaz; gerekirse sadece hatırlanan GENEL format
3. Taslak: insan yazar VEYA model taslak
4. Edit: eğitimci — dil, şık tuzağı, tek doğru
5. Similarity gate: bilinen soruya aşırı yakınsa RED → yeniden yaz
6. Anlatım adımları: sade Türkçe, examType öğretmen sesi
7. Manifest’e ekle + CI’da schema validate
```

### Similarity gate (pratik)

- Editör checklist: “Bu maddeyi bir PDF’den hatırlamıyor muyum?”  
- İleride: dahili embedding / fuzzy (opsiyonel); 1.0’da insan yeterli  
- Şüphe → `review.similarityCheck: fail` → yayın yok  

---

## 6) Büyüme yolu (post–1.0)

| Sürüm | Hedef |
|-------|--------|
| 1.0 | ~50–60 madde; şema + mini paket + eval/few-shot |
| 1.1 | Konu başına +N; veli raporuna örnek bağlanabilir |
| 1.2 | Pratik session: zayıf `topicId` → bankadan soru + çözüm |
| Sonra | Fine-tune / retrieval yalnızca `license: owned` set ile |

Büyütme kuralı: **aynı şema**, yeni JSON + manifest bump. Eski id’ler immutable (düzeltme = `version++` veya yeni id).

---

## 7) Teknik entegrasyon (kod)

| Katman | 1.0 |
|--------|-----|
| Repo | `content/item-bank/**` (mobil bundle veya Functions read) |
| Validate | `npm` script / jest: schema + topicId exists |
| Solve | Few-shot için seçilmiş id’ler `prompts`’a gömülür |
| Eval | `manifests/mvp-1.0.json` → QA dogfood listesi |
| UI | Opsiyonel “Örnek soru”; tam arşiv browser 1.2 |

Kullanıcı fotoğrafı ile gelen sorular item bank’e **otomatik yazılmaz**
(KVKK / telif belirsizliği). Banka yalnızca `owned` üretim hattından büyür.

---

## 8) Karar kaydı

- ✅ MVP 1.0’da **mini özgün item bank** dahil  
- ✅ Tarz kalibrasyonu için sınav ölçeği/yaklaşımı referans alınır  
- ❌ Kitapçık / PDF / site / dershane bankası içeriği repo’ya girmez  
- ✅ Sonraki güncellemelerin hedefi: aynı arşivi büyütmek  
- ✅ LYS tarzı → `ygs` track  

**Owner onayı:** Bu belge + mini paket 1.0 Definition of Done parçasıdır
(Polish / T06x görevleriyle birlikte).
