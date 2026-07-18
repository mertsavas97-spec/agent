# ÇözBil fiyat politikası (MVP)

**Karar tarihi:** 2026-07-18  
**Kaynaklar:** marketingskills `pricing` + `offers` + marketing-council oturumu  
(Hormozi, Dunford, Sutherland, Godin, Brunson — simülasyon); kurucu tercihi aylık **39 TL**.

## Özet tablo (TRY)

| Plan | Fiyat | Etkili aylık | Not |
|------|------:|------------:|-----|
| Haftalık giriş (7 gün) | **14,90 TL** | — | Düşük biletli offer; Premium’u deneyimletir |
| Aylık | **39 TL** | **39 TL** | Ana vitrin (brief bandı 39–59 tabanı) |
| Yıllık | **349 TL** | **≈29 TL** | ~%26 indirim vs 12×39; varsayılan “En avantajlı” rozeti |

Freemium değişmedi: **5 soru / gün** (Europe/Istanbul gün anahtarı).

**Reklam:** Haftalık / aylık / yıllık — **üç Premium plan da reklamsız**.  
Ücretsiz reklam matrisi: `docs/product/ads-policy.md`.

## Council özeti (simülasyon)

- **Hormozi / Brunson:** Önce kanca (haftalık), süreklilik aylık/yıllıkta; değeri fiyat kırmadan stack’le.
- **Dunford:** Rakip “ucuz app” değil; dershane/özel derse karşı anında foto-çözüm.
- **Godin (muhalif):** 39 altına inme — “ciddi sınav aracı” sinyali zayıflar.
- **Sutherland:** Yuvarlak 40 yerine **39** charm pricing; yıllıkta “ayda ~29 TL” çerçevele.
- **Kurucu kilidi:** Aylık **39 TL** (council’ın 49 önerisine karşı bilinçli tercih; band içinde).

## Play Billing SKU

| SKU / base plan | Rol |
|-----------------|-----|
| `cozbil_premium_weekly_intro` | 7 gün giriş offer (14,90 TL) |
| `cozbil_premium_monthly` | 39 TL / ay |
| `cozbil_premium_yearly` | 349 TL / yıl |

Intro: Play Console’da haftalık ürün **tek dönem** veya aylığa bağlı introductory offer olarak tanımlanır; token doğrulama `syncSubscription` ile gelir (şimdilik stub).

## Paywall davranışı

1. Kota bitince paywall.
2. Üç plan seçilebilir; varsayılan vurgu: **yıllık** (LTV).
3. CTA: “Hemen Başla” → seçili planın purchase stub’ı.
4. Escape: “Yarın tekrar dene” (ücretsiz 5 hak yarın yenilenir).

## Gözden geçirme tetikleri

- Free→paid dönüşüm &lt; %2 ve fiyat itirazı baskınsa → haftalık 9,90 test (A/B).
- Churn yüksek + AI maliyeti baskısı → yıllık öne çıkarma / aylık 49’a A/B (eski council önerisi).
- “Çok ucuz / güvenilmez” geri bildirimi → aylığı 49’a çek, yıllığı 399’a hizala.
