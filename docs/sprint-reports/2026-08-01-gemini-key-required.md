# Sprint report — Gemini key required (Vision-only fix)

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Kök neden

Metro `unsupported_type` + OCR metni = Gemini birincil yol çalışmadı.  
`GOOGLE_CLOUD_VISION_API_KEY` çoğu zaman **yalnız Vision** API’ye kısıtlı → Generative Language 403 → sessiz OCR fallback.

## Düzeltme

- `write-gemini-api-key-local.sh` — Generative Language enable + smoke + `GEMINI_API_KEY`
- `phone-demo-proxy-mac.sh` — Gemini key zorunlu (yoksa yaz / exit)
- Proxy boot smoke + Metro’ya `gemini: { status, error }`
- Soft OCR alt mangling `8 33 (32) 7 +` (yedek)

## Owner

```bash
git pull
bash scripts/write-gemini-api-key-local.sh
bash scripts/phone-demo-proxy-mac.sh
# Log: Gemini Vision solve: AÇIK + gemini smoke OK
# Aynı fotoğraf → Metro: gemini-vision veya gemini.status=solved
```

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** backend, qa  
**Kullanılan skill/agent setleri:** cozbil-team-skills, ship-gate  
**Skill bypass:** yok  
**QA Gate:** arithSolve / geminiVisionSolve / solveClient / typecheck PASS  
**Sonraki önerilen adım:** Mac’te Gemini key yaz + proxy restart  
