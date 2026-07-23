# Çoklu soru batch (MVP)

**Karar:** architect + designer + paywalls/ads — 2026-07-19  
**Durum:** mobil dogfood; Functions org-policy bypass (OCR proxy) ile uyumlu.

## Ürün kararları

| Madde | Karar | Gerekçe |
|-------|--------|---------|
| Batch tavanı | **5** | 3 sıkı; 7 abuse + proxy yükü; free günlük 5 hak ile hizalı |
| Free | Batch için **1 rewarded** (sandbox stub) | Abuse engeli; tek soru akışı reklam zorunlu değil |
| Premium | Reklamsız; yine **≤5 / batch** | Session abuse tavanı herkese |
| Kota | Her başarılı soru **1 günlük hak** | Mevcut `solveQuestion` ekonomisi |
| Capture | Galeri **çoklu seçim**; kamera tekli kalır | Expo multi + kamera UX |
| Loading | İlk hazır soruda sonuç açılır; diğerleri arka planda | “Hepsini bekle” yok |
| Sonuç UX | **Soru 1…N sekmeleri** + mevcut Adım/Kısa/Konu | Alt alta yığma yok |

## Akış

```
Galeri (≤5) → [Free: rewarded] → /solve-batch
  → paralel solve (concurrency 2)
  → ilk solved → MultiSolutionScreen (Soru sekmeleri)
  → diğer slotlar loading → ready / error
```

## Bilinçli sınırlar (sonraki sprint)

- Tek fotoğraftan otomatik soru bölme (crop detect) yok.
- Ders onayı batch’te tek (ilk soru); karışık ders batch’i sonra.
- Sunucu grant / AdMob production unit id sonraki.
