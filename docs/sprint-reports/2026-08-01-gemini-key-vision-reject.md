# Sprint — Gemini key: Vision-only reject + create Generative Language

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Problem

Owner Mac’te `write-gemini-api-key-local.sh` mevcut `cozbil*` Vision-only key’i
seçiyor (`grep …|cozbil`), smoke HTTP 400, `.env.local` yazılmıyor.
`phone-demo-proxy-mac.sh` içinde `if` bloğunda write fail `set -e` ile
çıkmıyor → Metro yine açılıyor, Gemini kapalı.

## Fix

- Aday key: yalnız `gemini|generative|ai-studio` (bare `cozbil` yok)
- Her aday smoke; fail → yeni key (`generativelanguage` + `vision`)
- `FORCE_NEW_GEMINI_KEY=1` desteği
- Proxy: write fail → `exit 1`; start öncesi Gemini smoke zorunlu

## QA Gate

- bash -n scripts OK
- typecheck/lint: script-only (N/A product code)
- guardian: exam/copy drift yok — pass
