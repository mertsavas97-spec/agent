# Karar: Reklam → Abonelik (ÇözBil)

**Tarih:** 2026-07-21  
**Soru:** Bu app için en uygun reklam üzerinden **subs** kazanma yolu nedir?  
**Kaynaklar:** `pricing-policy.md`, `ads-policy.md`, skills `ads` / `paid-ads` / `paywall-upgrade-cro` / `aso` / `cozbil-guardian`  
**Kapsam:** LGS + YGS/YKS + KPSS + Ehliyet · Android-first · TRY

> Rakamlar **karar modeli**dır (henüz canlı UA verisi yok). Canlı CPI/CPA gelince tabloyu güncelle.

---

## Kısa karar

| Sıra | Yol | Verdict |
|------|-----|---------|
| **1** | **Google App Campaigns** (Play + Search + YouTube) → optimize **abonelik / ilk satın alma** | **DOUBLE-DOWN** |
| **2** | **ASO + paywall CRO** (yıllık vurgu) — ücretli ölçek öncesi zorunlu zemin | **DOUBLE-DOWN** |
| **3** | Meta (IG/FB) — sınav sezonu creative + satın alma retarget; TR’de DST sürşarjı | **TEST (küçük)** |
| **4** | In-app AdMob (banner / ≤1 interstitial / rewarded) | **MAINTAIN** — subs değil; free ARPU + “reklamsız” vaadi |
| **5** | Install-optimize ucuz trafik / broad TikTok (LGS yaş) | **DEFUND / EXIT** (şimdilik) |

**Tek cümle:** Abonelik satmak için **install değil purchase** satın al; kanal olarak TR Android’de en uygun başlangıç **Google App Campaigns + yıllık paywall**.

---

## Neden Google App Campaigns #1?

1. **Niyet:** “LGS soru çöz”, “KPSS hazırlık”, “ehliyet soru” aramaları Play/Search/YouTube’da — ÇözBil’in core job’u.
2. **Android-first** ürün; Google en derin Android envanteri.
3. **Meta TR DST** (~%7,5 sürşarj, sektör notu 2026) Google’a göreli maliyet dezavantajı yaratır.
4. Education CPI globalde orta; TR Tier-3 → ham CPI düşük görünür ama **install→paid düşükse kaybedersin** — bu yüzden hedef event kritik.

Meta/TikTok: talep yaratır, creative ister, LGS bandında çocuk/yaş politikası riski yüksek → ilk 30–60 günde ana bütçe değil.

---

## Funnel (ölçülecek)

```
Reklam → Play install → onboarding (sınav) → ≥1 başarılı çözüm (aha)
  → kota baskısı (5/gün) → paywall → haftalık giriş / aylık / yıllık
```

**Optimize edilecek event (sırayla):**
1. `in_app_purchase` / subscription start (Play Billing)
2. Yoksa: `paywall_view` + `start_trial` / weekly purchase (yeterli hacim için)
3. **Asla uzun süre yalnızca `install`**

---

## Birim ekonomi (TRY, model)

Play kesintisi: **%15** (süregelen; ilk yıl %30 ise LTV ~%18 düşer).

| Plan | Liste | Net (~%15) |
|------|------:|----------:|
| Haftalık | 14,90 | ~12,7 |
| Aylık | 39 | ~33,2 |
| Yıllık | 320 | ~272 |

### Blended net LTV (varsayımlı mix)

| Senaryo | Mix özeti | Net LTV |
|---------|-----------|--------:|
| A muhafazakâr | intro-ağır, zayıf retention | **~76** |
| B baz | paywall yıllık iter | **~153** |
| C iyimser | yıllık + yenileme | **~243** |

### Hedef CAC (LTV:CAC ≥ 2)

| Senaryo | Max CAC / ödenen abone |
|---------|------------------------:|
| A | **~38 TRY** |
| B | **~76 TRY** |
| C | **~121 TRY** |

**Pratik tCPA başlangıç bandı:** **50–80 TRY / ilk abonelik** (B’ye yaslan; A’nın altına düşerse ölçekleme).

### Neden “ucuz install” zararlı?

`CPA_sub ≈ CPI / (install→paid)`.

Örnek: CPI 30 TRY + %2 convert → **CPA 1 500 TRY** ≫ LTV 153 → **net zarar**.  
Aynı LTV ile LTV:CAC=2 için install→paid %5 iken max CPI yalnızca ~4 TRY — gerçekçi değil.  
Sonuç: **install kampanyası ile subs kazanılmaz**; purchase kampanyası şart.

### In-app reklam (AdMob) vs subs

Free engagers için kaba ARPU (TR eğitim, illustrative): **~4–20 TRY/ay**.  
Aylık abone neti **~33 TRY**; yıllık net **~272 TRY**.  
→ AdMob **ana gelir yolu değil**; policy’deki gibi free basınç + Premium “reklamsız” kaldıraç.

---

## Karar zarar tablosu

| Seçenek | Kazanç | Zarar / risk | Ne zaman |
|---------|--------|--------------|----------|
| Google App → **purchase** | Niyetli kullanıcı; ölçülebilir tCPA | Learning için ~30–50 dönüşüm/hafta gerekir; creative refresh | Şimdi (listing + Billing hazırsa) |
| Google App → **install** | Ucuz hacim | LTV’yi yakar; düşük kalite | **Yapma** |
| Meta purchase / retarget | Sezon creative; remarketing | DST +%7,5; learning pahalı; creative yükü | tCPA Google’da tutunca %20–30 test |
| TikTok broad LGS | Genç reach | Yaş/çocuk reklam politikası; düşük intent | Guardian onayı + yaş gate sonrası |
| Sadece AdMob büyüt | Free ARPU | Paywall’ı zayıflatır; çözüm yüzeyine sızarsa churn | Policy tavanını aşma |
| ASO’suz ücretli | — | Yüksek CPI, düşük Play CVR | Önce listing |
| Haftalık intro’yu “ucuz CAC” sanmak | Düşük bilet | Tek hafta churn → LTV ~13 TRY | Yıllığa yönlendir |

---

## Önerilen 30 günlük plan

1. **Zemin (zorunlu):** Play listing + ASO TR pack (`docs/store/listing-copy-draft-tr.md`); Play Billing SKU canlı; Firebase/Play purchase event’leri.
2. **Kampanya:** Google App Campaigns — ülke TR, dil TR, hedef **abonelik/IAP**; tCPA 50–80 TRY; günde küçük bütçe (öğrenme).
3. **Creative:** Fotoğraf→adım adım çözüm (3–5 asset); abartı iddia yok (`cozbil-guardian`).
4. **Paywall:** Varsayılan yıllık 320 TL; haftalık yalnızca giriş; rewarded ikincil (`ads-policy`).
5. **Kill kuralı:** 7–14 gün, ≥30 purchase event veya tCPA > 1,5× LTV_B (~230 TRY) kalıcıysa creative/offer reset; install’e düşme.
6. **Meta:** Yalnızca Google’dan gelen purchaser lookalike + web/app retarget — ana bütçe değil.

---

## Guardian

- “%100 doğru”, sahte sosyal kanıt, sınav garantisi → yasak.
- LGS yaş bandı: child-directed / under-age AdMob + reklam creative politikası.
- Exam scope: LGS + YGS/YKS + KPSS (+ Ehliyet brief’te); “yakında” diline kayma.

---

## Sonraki veri gate

Canlı gelince doldur: CPI, install→aha, aha→paywall, paywall→paid, plan mix, D30 retention, gerçek LTV.  
Model dosyası: bu doküman.
