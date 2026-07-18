# LGS / YGS / KPSS — AI & veri stratejisi

> Kısa cevap: MVP’de kendi modelimizi **eğmiyoruz**. Üç sınav için ayrı
> **sistem prompt + konu kataloğu + etiketli kullanım verisi** kullanıyoruz.
> Klasik “algoritma eğitimi” (fine-tune) ancak veri biriktikten sonra
> (1.2+) değerlendirilir.

## 1) “Algoritma” derken MVP’de ne var?

| Katman | Ne | Nerede |
|--------|----|--------|
| Sınav seçimi | `examType: lgs \| ygs \| kpss` | kullanıcı profili |
| Konu kataloğu | Statik müfredat listesi | `apps/mobile/src/data/*-topics.ts` + `functions/src/data/topics.ts` |
| Çözüm motoru | Gemini Vision (veya demo stub) | `functions/src/solve/` |
| Prompt | Sınava özel öğretmen rolü | `functions/src/solve/prompts.ts` |
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

### C) Sonra (opsiyonel)

- Few-shot örnekler (lisanslı / kendi ürettiğimiz)
- 1.2: zayıf konudan **üretim** + ikinci model doğrulama
- Çok sonra: fine-tune / specialized model — yalnızca yeterli kaliteli etiket varsa

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
| MVP | Prompt + katalog + telemetri |
| 1.1 | Veli raporu = toplanan etiketlerin özeti |
| 1.2 | Üretim + kalite doğrulama; few-shot zenginleştirme |
| Sonra | Fine-tune / eval set — ancak binlerce kaliteli, izinli örnek sonrası |

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
- ✅ Veri moat = kullanım telemetrisi, telifli banka değil  
