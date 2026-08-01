# Sprint report — solve proxy device wiring

**Tarih:** 2026-07-31  
**Branch:** `cursor/scrub-google-api-key-pr31-4710`

## Problem

Telefon Metro logu: `solve: proxy off` — `EXPO_PUBLIC_SOLVE_PROXY_*` cihaz
bundle’ına inlinelanmıyor; Firestore solve path fail → “ulaşılamadı”.

## Fix

1. `apps/mobile/src/config/solveProxy.dev.local.ts` — git’te boş stub.
2. `solveViaProxy` önce bu dosyayı, sonra env/extra okur.
3. `phone-demo-proxy-mac.sh` LAN URL+token’ı TS dosyasına yazar.
4. `check-phone-demo-env.sh` stub doluluğunu doğrular.

## Owner

`git pull` → `phone-demo-proxy-mac.sh` → Metro restart → logda
`solve: bounded OCR proxy`. Dolu TS’yi commit etme.
