# LGS / YGS / KPSS — AI & veri stratejisi

> Kısa cevap: MVP’de kendi modelimizi **eğmiyoruz**. Üç sınav için ayrı
> **sistem prompt + konu kataloğu + etiketli kullanım verisi** kullanıyoruz.
> Klasik “algoritma eğitimi” (fine-tune) ancak veri biriktikten sonra
> (1.2+) değerlendirilir.

## 1) “Algoritma” derken MVP’de ne var?

| Katman | Ne | Nerede |
|--------|----|--------|
| Sınav seçimi | `examType: lgs \| ygs \| kpss` | kullanıcı profili |
| Konu kataloğu | Ders → konu ağacı (2020–2026) | `*-topics.ts` + `EXAM_SUBJECT_TREE_2020_2026.md` |
| Çözüm motoru | Gemini Vision (veya demo stub) | `functions/src/solve/` |
| Prompt | Sınav + ders (subject) router | `systemPromptForSolve` in `prompts.ts` |
| Etiketleme | Model + katalogdan `topicId` | solve JSON çıktısı |
| Zayıflık sinyali | “Anlamadım” / hata sayıları | `topicStats` |
| Dedup | pHash cache | `functions/src/cache/` |

Bu bir **RAG/fine-tune pipeline değil**; **prompt-tabanlı, sınav-aware çözüm + ölçüm** katmanı.

## 2) Veriyi nereden çekeceğiz?

### A) Şimdi (statik / açık kaynak müfredat)

1. **MEB üniteleri / kazanım listeleri** (LGS ortaokul matematik-Türkçe)
2. **ÖSYM / YKS (YGS hattı) konu başlıkları** — resmi kılavuz + yaygın dershane konu ağaçları (telifli soru metni kopyalanmaz)
3. **KPSS GY-GK konu listeleri** — ÖSYM kılavuz + standart konu ağacı
4. Repoda tutulan JSON/TS kataloglar (`lgs-topics`, `ygs-topics`, `kpss-topics`)

> Telif: Hazır soru bankası / PDF’leri olduğu gibi yüklemek yok.
> Katalog = konu adları + id’ler. Soru görselleri kullanıcıdan gelir.

### B) Ürün kullanıldıkça (asıl moat)

Her çözülmüş sorudan:

- `examType`, `subject`, `topicId`
- çözüm adımları (metin)
- “anlamadım” follow-up sayısı
- zaman damgası / streak

Bu veri **kişisel çalışma haritası** ve ileride B2B / premium plan için birikir.
Ham görseller loglanmaz; Storage path + metin etiketleri tutulur.

### C) Özgün item bank (MVP 1.0 mini → sonra büyür)

- Ayrıntı: **`docs/architecture/item-bank.md`**
- Kitapçık/PDF/dershane **kopyalanmaz**; tarz/ölçek referansı → sıfırdan madde
- 1.0: ~50–60 madde (soru + anahtar + anlatım); seed: `content/item-bank/`
- 1.2: pratik session bu arşivi büyütülmüş haliyle kullanır
- Fine-tune yalnızca `license: owned` set ile

## 3) Üç sınavı nasıl “ayırıyoruz”?

```
Kullanıcı examType seçer
        ↓
Prompt = o sınavın öğretmen rolü + müfredat vurgusu
        ↓
topicId ∈ o sınavın katalogundan seçilir
        ↓
İlerleme / zayıflık examType bazında aggregation
```

Aynı Gemini modeli; **davranış farkı prompt + katalog + ürün kurallarından** gelir.
Ayrı üç model eğitmek MVP’de maliyet/ROI olarak gereksiz.

### Prompt farkı (örnek)

- **LGS:** 8. sınıf dil, kısa adımlar, ortaokul kavramları
- **YGS/YKS hattı:** lise kazanımları, daha soyut (fonksiyon, trigonometri…)
- **KPSS:** GY tarzı işlem/problem temposu, yetişkin adaya uygun dil

## 4) “Eğitmek” ne zaman?

| Faz | Ne yapılır |
|-----|------------|
| MVP 1.0 | Prompt + katalog + telemetri + **mini özgün item bank** |
| 1.1 | Veli raporu; banka konu başı büyür |
| 1.2 | Pratik session (bankadan) + kalite doğrulama |
| Sonra | Fine-tune — yalnızca owned arşiv + telemetri |

**Başarı ölçüsü şimdilik:** doğru `topicId`, kullanıcı “anladım” oranı,
red/moderation oranı, demo→live geçişte insan örnekleme QA.

## 5) Sıradaki mühendislik işleri (kredisiz)

1. Katalogları uzmanla genişletmek (özellikle YGS/KPSS matematik)
2. Prompt’lara sınav-özel few-shot eklemek (kendi yazdığımız örnekler)
3. Eval set: her sınavdan 20–50 anonim örnek foto (iç test)
4. US2+ ile “anlamadım” → zayıflık sinyalini büyütmek

## Karar (kilit)

- ❌ MVP’de LGS/YGS/KPSS için ayrı model eğitimi yok  
- ✅ Ayrı **prompt + topic catalog + analytics** var  
- ✅ Canlı model = Gemini (kredi gelince); şimdi demo stub  
- ✅ Veri moat = kullanım telemetrisi + **özgün item bank** (telifli banka değil)  
