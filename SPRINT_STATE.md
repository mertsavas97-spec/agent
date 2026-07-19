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

## Exam subject tree (2026-07-19)
Araştırma + katalog: `docs/architecture/EXAM_SUBJECT_TREE_2020_2026.md`  
LGS/YGS(YKS)/KPSS alt dersleri UI + `systemPromptForSolve` + `clampTopicId`.

## Pipeline P0/P1 (2026-07-19) — subject-aware
Audit uygulandı + ders ağacı hattı:
- Vision fail-closed, demo cloud block, stub cache off, Firestore kilidi
- JSON repair/retry, T068 few-shots (math+turkish), `teacherLineForSubject`
- Firestore persistent rate limit (`rateLimits`)
- Mobil: Konular → subjectHint → solve
Doc: `docs/architecture/PIPELINE_AI_AUDIT_2026-07-19.md` — dogfood **evet**; Play hâlâ IAM + eval.

## UI polish (2026-07-19) — durduruldu
- Home: daire CTA kaldırıldı → tam genişlik “Soru fotoğrafı çek / Galeriden soru seç”
- Net wording (kitap/defter sorusu); sınav seçili state + varsayılan LGS
- **Konular** tab (T069): örnek soru + adım adım anlatım (`app/sample/[id]`)
- Brief: `docs/design/home-konular-brief.md`
