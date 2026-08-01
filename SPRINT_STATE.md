# Sprint State

**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**Hedef:** Gemini Vision first solve — Vision-only key tuzağını kapat

## Bu tur

- [x] Proxy: fotoğraf → Gemini birincil; OCR+yerel yedek
- [x] Soft colon OCR repair
- [x] Splash / exam confirm / banner / interstitial
- [x] macOS `mapfile` → while-read
- [x] Vision-only `cozbil*` key reject; smoke geçen Generative Language key yaz
- [x] Proxy: Gemini smoke fail → başlamasın

## Owner Mac (zorunlu)

```bash
cd ~/agent
git fetch && git checkout cursor/home-polish-yks-ads-ocr-2914 && git pull

# Vision-only key varsa zorla yeni Generative Language key:
FORCE_NEW_GEMINI_KEY=1 bash scripts/write-gemini-api-key-local.sh
# Beklenen: ✓ Gemini smoke OK (yeni key)  +  ✓ Yazıldı

bash scripts/phone-demo-proxy-mac.sh
# Beklenen: Gemini Vision solve: AÇIK … smoke OK

# Eski Metro 8081 varsa kapat; tek port:
bash scripts/phone-dev-build.sh metro
```

Başarı: proxy log `solve-proxy gemini-vision`; Metro’da `gemini.status` ≠ `off`/`error`.
