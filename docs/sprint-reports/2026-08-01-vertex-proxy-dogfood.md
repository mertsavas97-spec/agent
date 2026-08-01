# Sprint — Phone proxy: Vertex AI (not GCP API keys)

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Problem

`gcloud services api-keys create` keys → Generative Language
`API_KEY_INVALID`. Org policy also blocks some key updates
(`disableServiceAccountApiKeyCreation`). AI Studio key = ayrı cüzdan.

## Fix

- Dogfood proxy: `COZBIL_USE_VERTEX=1` + `gcloud auth print-access-token`
- `scripts/write-vertex-solve-local.sh` + smoke
- `write-gemini-api-key-local.sh` → Vertex’e yönlendirir
- `geminiVisionSolve.mjs` Vertex transport

## Owner

```bash
git pull
bash scripts/write-vertex-solve-local.sh   # ✓ Vertex smoke OK
bash scripts/phone-demo-proxy-mac.sh
bash scripts/phone-dev-build.sh metro
```
