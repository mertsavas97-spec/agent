# Sprint note — 2026-07-22 phone dogfood UX + solve path

## Issues from screenshots
1. Analyzing white icon flash
2. Solve “servise ulaşılamadı” (Functions 403 / no trigger)
3. Progress freeze at ~92%
4. Home “Seriye başla” empty dots looked unfinished

## Fixes
- `AnalyzingView` navy plate + `CozbilRobot` `defaultSource`, animate off on loading
- Crawl target 0.97 / 12s (`solveTiming`)
- Streak week card with Pzt–Paz labels + hint copy
- Dogfood: solve-proxy + lhr tunnel wired in gitignored `.env` (Functions still 403)

## QA
- typecheck PASS
- AnalyzingView / solveTiming / home.smoke PASS
- Bundle embeds Firebase + proxy URL PASS
