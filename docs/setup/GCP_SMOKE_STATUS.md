# Owner GCP smoke — 2026-07-18 (secrets NOT in this file)

## Verified locally (keys in gitignored `.env.local` only)

| Check | Result |
|-------|--------|
| Vision SafeSearch | **OK** (HTTP 200 + annotation) |
| Gemini auth / list models | **OK** |
| Gemini generateContent | **FAIL 429** — prepayment credits depleted |
| Runtime mode with keys | `live` (`COZBIL_DEMO_AI=0`) |
| Secrets committed to git | **No** |

## Bugs / gaps in provided info

1. **İki farklı proje numarası**
   - Firebase `cozbil-dev` → `416588183650`
   - Gemini AI Studio notu → `311961142561`
   - Bunlar aynı GCP projesi değil gibi. Kredi `cozbil-dev`’e bağlıysa Gemini key’i **cozbil-dev** altında yeniden oluştur.

2. **Gemini kredi bitmiş** — AI Studio: “Your prepayment credits are depleted.” Startup/billing’i Gemini’nin bağlı olduğu projeye tanımla veya yeni key + paid project.

3. **Eksik (henüz verilmedi / kurulmadı)**
   - Firebase **Web app** config (`EXPO_PUBLIC_FIREBASE_*`)
   - **Storage** bucket
   - **Blaze** plan (Functions deploy için; konsolda Spark görünüyordu)
   - Functions’a secret deploy (lokal `.env` ≠ production)

4. **Güvenlik** — Key’ler chat’te görüldü. Test bitince Console’dan **rotate/regenerate** önerilir. Repoya yazılmadı.

## Firebase web (2026-07-18)

| Field | Value |
|-------|--------|
| projectId | `cozbil-dev-f9583` |
| projectNumber | `717206185063` |
| storageBucket | `cozbil-dev-f9583.firebasestorage.app` |
| authDomain | `cozbil-dev-f9583.firebaseapp.com` |
| Billing / Blaze | linked / enabled |
| Anonymous Auth | owner confirmed |
| Local env | `apps/mobile/.env` (gitignored) |

## Owner next

1. Gemini API key’i **`cozbil-dev-f9583`** (veya aynı billing) altında yenile; 429 olmamalı  
2. Vision key’in bu proje/billing altında olduğunu doğrula  
3. “Gemini OK” → Functions deploy + rules + US6
