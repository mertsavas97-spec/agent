# Sprint State

**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**Hedef:** Splash redesign + exam confirm + OCR tolerance + banner/interstitial

## Bu tur (hazır)

- [x] PremiumSplash — wordmark hero (icon-only değil) + exam strip
- [x] Exam switch — onay Alert → “Reklam izle ve geç” → rewarded
- [x] OCR — soft-accept (Vision→Gemini→Tesseract); yalnız aşırı junk reject
- [x] Banner — live + `__DEV__` Google test fallback
- [x] Interstitial — çözüm bitince ana sayfaya geçişte 1 geçiş reklamı
- [x] Home logo circle / YKS etiketi / loading floors (önceki tur)

## Owner Mac (doğrulama)

```bash
cd ~/agent
git fetch && git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull
bash scripts/phone-demo-proxy-mac.sh
# Metro restart
bash scripts/phone-dev-build.sh metro
```

Smoke: splash (ÇözBil + LGS·YKS·KPSS·Ehliyet) → mod değişince onay → reklam →
banner altta → soft/zoom foto çöz → çözümden çıkınca geçiş reklamı.

**Not:** Proxy’yi OCR değişiklikleri sonrası yeniden başlat.
