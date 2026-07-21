# Sprint report — Solve pipeline answer detection

**Date:** 2026-07-21  
**Focus:** Doğru şık / cevap hero boş kalıyordu; 4 sınav matrix

## Root cause

1. **Soru no → matematik:** `3. 2 + 2 × 3` → `3.2+2*3=9.2` (şık B=8 kaçırılıyordu)
2. **Tip-only verbal “solved”:** Cevapsız tip adımları `solved` gidiyordu → hero boş
3. **Mod sızıntısı:** `enforceExamPipeline` yabancı `answer`’ı tutuyordu

## Fixes

- `arithSolve`: soru numarası strip + glued `N.digit` düzeltmesi  
- `verbalSolve` / `server`: cevapsız tip → null / solved değil  
- `trafficSolve`: kemer + kavşak; şık parse `A.`  
- `solutionAnswer`: Doğru yaklaşım/sıra, `4. Cevap` title  
- `enforceExamPipeline`: cross-package → answer temizle + assisted  

## Verification

`node scripts/solve-proxy/pipelineMatrix.test.mjs` — LGS/YGS/KPSS/Ehliyet (traffic/vehicle/firstaid) + exam-switch isolation ✅

## Soft / remaining

- YGS fen (biology classify OK, choice solver yok)  
- Denklem çözücü (`2x+5=17`) henüz yok — aritmetik öncelikli  
