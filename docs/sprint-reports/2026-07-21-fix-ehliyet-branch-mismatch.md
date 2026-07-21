# Fix — Ehliyet çözüm branş sapması (2026-07-21)

## Kök neden
`normalizeSolvedBranch` generic offline fallback adımlarındaki **“ilk yardım”** ifadesini gerçek soru sanıp konuyu **İlk Yardım / ABC**’ye taşıyordu. Güç aktarma sorusu da bu yüzden yanlış header + konu anlatımı alıyordu.

## Düzeltme
- Branş sınıflaması: `trafikBranchFromText.ts` (OCR/cevap öncelikli; generic tip adımları yok sayılır)
- `localSolveFallback`: OCR’a göre vehicle/traffic/firstaid + branşa özel adımlar
- Proxy: OCR preview client’a iletilir; güç aktarma OCR gürültüsüne dayanıklı
- Testler: 18 mobile + trafficSolve (noisy) PASS

## Agent / skill
- Koordinatör · executor · qa-tester · systematic-debugging
- Skills: `cozbil-guardian` · `ship-gate`
