# Sprint report — OCR/math accuracy (PC screen + exponents)

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Problem

PC ekran fotoğraflarında pipeline “solved” dönüyor ama yanlış:
- `8/3 : (3/7+2/3)` → `A) 2` (tam sayılı şık parse yok; `:`→`*` hatası)
- `2^x=4^y … =96` → `1/10` (üslü solver yok; `(2020)` yılı kesire dönüşüyor)

## Fix

- Mixed şık parse (`2 10/23`)
- Colon division preference (multiply false-positive yok)
- `tryExponentialEquation` (aynı taban + MCQ)
- Year sanitize `(2020)`
- OCR repair: missing `^`, mixed şık glue
- Linear `) 44` → `)+4` recovery

## QA

`scripts/solve-proxy` npm test PASS (arith + realImage + ocrQuality).
