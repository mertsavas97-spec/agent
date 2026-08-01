# Sprint State

**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**Hedef:** Gemini Vision first solve (kalıcı) — OCR yama döngüsünü bitir

## Bu tur (hazır)

- [x] Proxy: fotoğraf → Gemini birincil; OCR+yerel yedek
- [x] `phone-demo-proxy-mac.sh` GEMINI_API_KEY (Vision key fallback)
- [x] Soft colon OCR repair (köprü)
- [x] Splash / exam confirm / banner / interstitial (önceki)

## Owner Mac (zorunlu yeniden başlat)

```bash
cd ~/agent
git fetch && git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull
bash scripts/phone-demo-proxy-mac.sh
# Logda: Gemini Vision solve: AÇIK
# tail -f /tmp/cozbil-phone-solve-proxy.log   →  solve-proxy gemini-vision
bash scripts/phone-dev-build.sh metro
```

Smoke: bulanık / PC ekran soru → cevap (Metro’da `unsupported_type` olmamalı).
