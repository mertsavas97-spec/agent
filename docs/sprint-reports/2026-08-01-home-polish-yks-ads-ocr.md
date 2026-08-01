# Sprint report — home polish, YKS, ads, OCR

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Yapılanlar

1. **Premium splash** — `PremiumSplash` (navy, brand, orbit); BootstrapGate blocker
2. **Logo circle** — `CozbilRobot` `borderRadius: size/2`
3. **Loading** — progress floors yükseltildi, crawl 38s / min 3.5s
4. **Ads** — sınav mod switch → `runRewardedExamSwitch`; AdMob warm; banner fail hide
5. **YGS → YKS** — kullanıcı etiketleri (id `ygs` kaldı)
6. **OCR** — Vision preprocess + zoom/screen Tesseract passes

## QA Gate

- typecheck PASS
- lint PASS
- smoke PASS (72 targeted Jest + ocrQuality)
- guardian PASS (YKS owner kararı; abartılı copy yok)
