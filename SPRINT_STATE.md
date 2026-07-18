# Sprint State

**Aktif çalışma yeri:** Mac masaüstü (lokal) — cloud agent handoff  
**Branch:** `cursor/cozbil-polish-capture-loading-9131`  
**Kurulum:** `docs/setup/DESKTOP_LOCAL_SETUP.md` + `bash scripts/setup-desktop-macos.sh`

## Ürün / backend

- Firebase/GCP: `cozbil-dev-f9583`
- AI: Vertex `gemini-2.5-flash` @ `us-central1` (`COZBIL_USE_VERTEX=1`)
- Functions: `europe-west1`

## Tamamlanan (özet)

- US1–US5 solve / explain / onboarding / history / progress  
- US6 paywall + pricing (14,90 / 39 / 349) + ads policy stub  
- US7 exam switcher, abuse gates, profil (kota/çıkış/silme talebi)  
- Polish: galeri CTA, analyzing progress, prompt split, tab bar fix, Auth AsyncStorage  

## Açık

- Item bank doldurma T067+  
- EAS iOS kota / TestFlight  
- T062 icon, T063 dogfood raporu  
- `main` merge  

## Lokal demo

```bash
cd ~/Desktop/cozbil
git pull origin cursor/cozbil-polish-capture-loading-9131
cd apps/mobile
npx expo run:ios
```

## UI polish (2026-07-18)
- ExamModeSwitcher: “Sınavın” etiketli segmented control + Lise/Üniversite/Kamu
- Home / Geçmiş / İstatistik premium hierarchy + EmptyState
- Brief: `docs/design/premium-polish-brief.md`
