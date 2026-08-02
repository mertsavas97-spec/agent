# Sprint report — Gemini Vision first (kalıcı solve)

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Ne değişti?

Telefon dogfood proxy artık **önce fotoğrafı Gemini’ye** veriyor (tüm sınav paketleri).  
OCR + yerel solver yalnız yedek. Soft OCR regex yamaları köprü olarak kaldı.

## Dosyalar

- `scripts/solve-proxy/geminiVisionSolve.mjs` — image→JSON solve
- `scripts/solve-proxy/server.mjs` — Gemini first wiring + health flag
- `scripts/phone-demo-proxy-mac.sh` — `GEMINI_API_KEY` (yoksa Vision key)

## QA Gate

- geminiVisionSolve.test.mjs PASS  
- arithSolve / ocrQuality / serverBinary PASS  
- guardian PASS (abartılı “%100” yok; şeffaflık notu korundu)

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** backend, mobile (proxy ops), qa, guardian  
**Kullanılan skill/agent setleri:** cozbil-team-skills, cozbil-expo-mobile, cozbil-guardian, ship-gate  
**Skill bypass:** yok  
**QA Gate:** typecheck N/A (mjs) / lint N/A / smoke PASS / guardian PASS  
**Sonraki önerilen adım:** Mac’te proxy’yi yeniden başlat; logda `solve-proxy gemini-vision` ara  
