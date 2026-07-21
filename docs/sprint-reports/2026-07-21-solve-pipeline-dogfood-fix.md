# Sprint report — 4-exam solve pipeline (dogfood) 2026-07-21

## Root cause (confirmed from phone screenshots)

1. **`EXPO_PUBLIC_SOLVE_PROXY_URL` was unset** → app never hit deterministic OCR proxy.
2. Firebase callable / Firestore path fails (403 / unauthenticated / stub AI) → **`buildLocalSolveFallback`** tip-only path.
3. **`resolveSolutionAnswer`** treated the last tip step as “DOĞRU CEVAP” (≤80 char instructional copy).
4. Unknown subject defaulted to **`subjectsForExam()[0]` = Türkçe** on KPSS → “Tahmin: Türkçe” on math photos.

## Fixes shipped

| Area | Change |
|------|--------|
| Infra | Start solve-proxy + cloudflared; set `EXPO_PUBLIC_SOLVE_PROXY_URL`; Metro `--clear` |
| OCR | Gemini multimodal fallback when Vision key missing (`visionOcr.mjs`) |
| Math | `[ ]` → `( )` in `arithSolve.normalizeExpr` (KPSS nested fractions → **E) 7**) |
| Turkish | Line-break tolerant `anlatım biçimi` stem match |
| Ehliyet | 2-part I.Şaft / II.Diferansiyel choice match |
| UI | Tip steps no longer become answer hero; subject sheet `hasGuess` |
| Client | Proxy URL wired for dogfood |

## Fixture verification (local solvers)

- KPSS math brackets → **7 / E**
- KPSS Türkçe anlatım → **öyküleme**
- Ehliyet kırmızı+sarı → **A Harekete hazırlanmalı**
- Ehliyet şaft 2-part → **A I. Şaft, II. Diferansiyel**
- `pipelineMatrix.test.mjs` + arith/verbal/traffic tests PASS
- `solutionAnswer` tip→answer regression test PASS

## Dogfood note

Proxy + Metro tunnels must stay running on the Mac. If tunnel URL rotates, update `.env` and restart Metro.
