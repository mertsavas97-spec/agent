# Sprint — Gemini key create: show errors + lift Vision restrictions

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Problem

`FORCE_NEW_GEMINI_KEY=1` → create failed with no gcloud stderr
(`2>/dev/null` + dual `--api-target`). Owner stuck: “key oluşturulamadı”.

## Fix

- Enable `apikeys.googleapis.com` + Generative Language
- Create **unrestricted** key; print real gcloud errors
- Fallback: `api-keys update --clear-restrictions` on existing vision/cozbil keys + smoke
- Manual AI Studio path in error text

## Owner

```bash
git pull
FORCE_NEW_GEMINI_KEY=1 bash scripts/write-gemini-api-key-local.sh
```
