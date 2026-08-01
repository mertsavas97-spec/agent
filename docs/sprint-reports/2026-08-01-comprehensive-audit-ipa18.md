# Sprint — Comprehensive audit + IPA prep (build 18)

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**Store canlı:** 1.0.1 (17) → local IPA hedef **1.0.1 (18)**

## Audit özeti

| Alan | Sonuç |
|------|--------|
| Vertex/Gemini first (proxy + Functions) | PASS |
| OCR-first zorlama | Yok (OCR = yedek) |
| AdMob banner/interstitial/rewarded | PASS (banner tab’lara eklendi) |
| Interstitial policy | PASS (ads-policy ≤5/gün, doğal mola) |
| OCR garbage katılığı | Softened + Gemini sonrası soft-skip |
| UX “Metin okunuyor” | → “Soruyu inceliyorum” (AI-first) |
| buildNumber | 3 → **18** |

## Kod değişiklikleri

- `app.json` buildNumber 18
- BannerSlot: history / stats / profile
- liveSolveCopy AI-first copy
- proxy: gemini trace on solved; soft garbage after Gemini
- visionOcr: looser length/ratio; blank-frame rules kept
- phone-demo log hints updated

## IPA

Cloud agent Linux — local IPA **Mac’te**:

```bash
cd ~/agent && git pull
# .env.local Firebase + AdMob production keys hazır
bash scripts/mac-build-ipa-with-push.sh
# veya: bash scripts/build-ios-ipa-local.sh
```

## QA Gate

- typecheck PASS
- lint PASS
- ocrQuality + geminiVisionSolve + liveSolveCopy/adsPolicy PASS
- guardian PASS (scope/copy)
