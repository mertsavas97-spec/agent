# ÇözBil fiyat politikası (MVP 1.0)

**Karar tarihi:** 2026-07-20 (SSoT; yıllık **320 TL** — 2026-07-21)  
**Kaynaklar:** marketingskills `pricing` + `offers` + `paywalls`; kurucu tercihi aylık **39 TL**.  
**Canonical:** Bu dosya + `apps/mobile/src/features/paywall/pricing.ts`.

## Özet tablo (TRY)

| Plan | Fiyat | Etkili aylık | Not |
|------|------:|------------:|-----|
| Haftalık giriş (7 gün) | **14,90 TL** | — | Düşük biletli offer |
| Aylık | **39 TL** | **39 TL** | Ana vitrin (kilitleme) |
| Yıllık | **320 TL** | **≈26,7 TL** | **%32 indirim** vs 12×39 (468 TL); varsayılan “En avantajlı” |

Freemium: **5 soru / gün** (Europe/Istanbul gün anahtarı).

**Reklam:** Haftalık / aylık / yıllık — **üç Premium plan da reklamsız**.  
Ücretsiz reklam matrisi: `docs/product/ads-policy.md`.

## Play Billing SKU

| SKU / base plan | Rol |
|-----------------|-----|
| `cozbil_premium_weekly_intro` | 7 gün giriş offer (14,90 TL) |
| `cozbil_premium_monthly` | 39 TL / ay |
| `cozbil_premium_yearly` | 320 TL / yıl |

## Paywall davranışı

1. Kota bitince paywall (`variant=quota`).
2. Profil / Ayarlar / Ana sayfa Premium CTA → `variant=browse`.
3. Üç plan seçilebilir; varsayılan vurgu: **yıllık** (LTV).
4. İlk ekranda fiyat + indirim oranı görünür olmalı.
5. CTA: “Hemen Başla” / yıllıkta “Yıllıkla Başla”.
