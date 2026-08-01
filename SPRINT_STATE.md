# Sprint State

**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**Hedef:** Audit temiz + local IPA **1.0.1 (18)** (store canlı 17)

## Bu tur

- [x] AdMob / pipeline / OCR audit
- [x] Vertex-first doğrulandı; OCR soft yedek
- [x] Banner tab shell (home+history+stats+profile)
- [x] AI-first analyzing copy
- [x] buildNumber **18**
- [ ] Owner Mac: `bash scripts/mac-build-ipa-with-push.sh`

## Owner Mac — IPA

```bash
cd ~/agent && git pull
bash scripts/mac-build-ipa-with-push.sh
# Çıktı: ~/Desktop/cozbil-production.ipa  (veya IOS_IPA_OUT)
```

Dogfood (dev client) ayrı:

```bash
bash scripts/write-vertex-solve-local.sh
bash scripts/phone-demo-proxy-mac.sh
bash scripts/phone-dev-build.sh metro
```
