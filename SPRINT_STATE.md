# Sprint State

**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**Hedef:** Premium splash + YKS etiketi + ads gate + OCR zoom/PC + loading

## Bu tur (hazır)

- [x] PremiumSplash (BootstrapGate)
- [x] Home logo circle
- [x] YGS → YKS (user-facing; id `ygs`)
- [x] Exam switch rewarded ad
- [x] Multi-batch rewarded (mevcut) + AdMob warm + banner fail-safe
- [x] Analyzing progress floors / crawl snappier
- [x] OCR zoom + PC screen preprocess (solve-proxy)

## Owner Mac (doğrulama)

```bash
cd ~/agent
git fetch && git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull
bash scripts/phone-demo-proxy-mac.sh
# Metro restart
bash scripts/phone-dev-build.sh metro
```

Smoke: splash → home circle logo → YKS chip → mod değişince ödüllü reklam →
çoklu soru reklam → banner → zoom/PC foto çöz.
