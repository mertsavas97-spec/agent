# Sprint report — 2026-07-22 — Solve pipeline dogfood fix

## Sprint Agent Raporu

**Koordinatör:** Auto (Composer)
**Kullanılan ekipler:** mobile, qa, guardian
**Kullanılan skill/agent setleri:**
- `cozbil-team-skills` (route)
- `cozbil-expo-mobile` (picker / client solve)
- `cozbil-guardian` (exam/copy scrub)
- `ship-gate` (QA gate checklist)

**Çalıştırılan lane'ler:**
- Diagnose: dead localhost.run proxy URL in `.env` → phone got HTML “no tunnel” / failed solve
- OCR: phone photos → garbage Tesseract / wrong şık; multi-pass preprocess + % repair + choice graft
- Client: iOS Compatible JPEG representation; label-only answer acceptance; tunnel-down copy

**Skill bypass:** Context7 (no new third-party API surface beyond existing Expo ImagePicker)

**QA Gate:**
- typecheck: PASS (`apps/mobile`)
- lint: N/A (Phase 1 placeholder)
- smoke: PASS — 4 phone fixtures LGS/YGS/KPSS/Ehliyet via local + public proxy tunnel (B3 / E9 / A90 / B50)
- errors: temiz
- guardian: PASS (no exam/copy drift; rejected OCR copy is neutral)

**Sonucu etkileyen kök nedenler:**
1. Dogfood proxy tüneli ölmüştü; uygulama eski `EXPO_PUBLIC_SOLVE_PROXY_URL` ile konuşuyordu → sonuç/error ekranı.
2. iPhone HEIC / zayıf OCR → çöp metin → yanlış şık veya `unsupported_type`.

**Sonraki önerilen adım:**
- Telefonda yeni Metro deep link ile tekrar dogfood
- İsteğe bağlı: `GOOGLE_CLOUD_VISION_API_KEY` / `GEMINI_API_KEY` ile OCR kalitesini production seviyesine çek
- `scripts/dogfood-sync-proxy-url.sh` tünel yenilendiğinde çalıştır + Metro restart
