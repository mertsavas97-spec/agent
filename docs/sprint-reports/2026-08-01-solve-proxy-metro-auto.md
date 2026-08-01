# Sprint report — solve proxy Metro auto

**Tarih:** 2026-08-01  
**Branch:** `cursor/scrub-google-api-key-pr31-4710`

## Problem

Pull sonrası log hâlâ `proxy off`; stub/env boş kalmış. Firestore 40s timeout.

## Fix

`solveProxyConfig.ts`: `__DEV__` iken Metro `hostUri` → `http://<mac>:8787` +
token `cozbil-phone-demo` (script default ile aynı). `proxy off` logu artık
`urlSource` / `metroHost` teşhis eder.

## Owner

`git pull` → `phone-demo-proxy-mac.sh` (process ayakta) → Metro restart →
`solve: bounded OCR proxy`.
