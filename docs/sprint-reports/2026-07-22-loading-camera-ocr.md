# Sprint — Loading UX + camera/screen OCR

**Tarih:** 2026-07-22  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**PR:** https://github.com/mertsavas97-spec/agent/pull/18

## Özet

Çözüm loading ekranı soluk/statik görünüyordu; galeri OK iken kamera ve PC ekranı fotoğraflarında OCR/denklem onarımı kırılıyordu. Loading’e brand ışık animasyonu + parlak robot; proxy’ye ekran-foto preprocess ve denklem OCR recover eklendi.

## Değişiklikler

- `AnalyzingView`: drifting orange/light washes; bright robot plate
- `CozbilRobotInstant`: `tone="bright"`
- Camera JPEG quality ↑; `visionOcr` screen preprocess + `repairEquationOcr`
- `arithSolve` / `classifyOcr` denklem cue güçlendirmesi
- Multi-solve loading → `live` copy path

## QA Gate

- typecheck: PASS (`apps/mobile`)
- proxy tests: PASS (realImagePipeline lgs/ygs/kpss/trafik)
- guardian: PASS (scope LGS+YGS+KPSS+Ehliyet; copy abartısız)
- smoke: dogfood reload + kamera/PC-ekran denemesi kullanıcıda

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** Executor, QA, Guardian  
**Kullanılan skill/agent setleri:** cozbil-team-skills, cozbil-expo-mobile, cozbil-guardian  
**Skill bypass:** yok  
**QA Gate:** typecheck PASS / lint N/A (focused) / smoke pending phone / errors none / guardian PASS  
**Sonraki önerilen adım:** Telefonda Metro reload; kamera + PC ekranı YGS denklem dogfood doğrula.
