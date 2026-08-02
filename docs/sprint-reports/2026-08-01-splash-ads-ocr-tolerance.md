# Sprint report — splash, exam confirm, OCR tolerance, ads

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Yapılanlar

1. **Premium splash** — icon-only değil; ÇözBil wordmark hero, tagline, accent bar, LGS·YKS·KPSS·Ehliyet strip
2. **Sınav modu** — değişimde önce onay Alert (“Reklam izle ve geç”), sonra ödüllü reklam (çoklu çöz ile aynı akış)
3. **OCR** — garbage gate gevşetildi; Vision → Gemini → Tesseract + soft-accept; yalnızca boş/pipe gürültü hard-reject
4. **Banner** — live unit; `__DEV__` no-fill → Google test banner retry
5. **Geçiş reklamı** — çözümden ana sayfaya çıkışta interstitial (`interstitialAfterBilledSolves: 0` + AdMob `__DEV__` test retry)

## QA Gate

- typecheck PASS
- lint PASS
- smoke PASS (PremiumSplash / useExamModeChange / adsPolicy / ocrQuality + ads suites)
- guardian PASS (abartılı copy yok; exam strip LGS+YKS+KPSS+Ehliyet)

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** design, mobile, backend (OCR), qa, guardian  
**Kullanılan skill/agent setleri:** cozbil-team-skills, cozbil-expo-mobile, cozbil-guardian, ship-gate  
**Skill bypass:** yok  
**QA Gate:** typecheck PASS / lint PASS / smoke PASS / errors none / guardian PASS  
**Sonraki önerilen adım:** Mac’te `phone-demo-proxy-mac.sh` + native dogfood — splash, mod confirm, soft foto OCR, banner + leave interstitial
