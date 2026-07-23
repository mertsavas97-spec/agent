# ÇözBil — Comprehensive Product Audit (post–Wave A)

**Date:** 2026-07-21  
**Explore agents:** [UI/UX](246da897-89e5-48d0-8515-7aa822e9661c) · [Settings/Ads/IAP](e55957d3-a7dc-460d-b360-4aa03d161f4d) · [4-exam pipeline](23d80a9d-414e-4628-88ec-016a08b49746)  
**Verdict:** Dogfood **PARTIAL-GO**. Store **NO-GO**.

## Direct answers

| Soru | Cevap |
|------|--------|
| UI/UX eksikleri biliniyor mu? | **Evet** — D01–D30 ranked; P0 dark/demo/Binlerce/streak/onboarding a11y shipped or in progress |
| Ayarlar sorunsuz mu? | **Hayır** — push delivery yok; AdMob stub; +1 kota sunucusuz; IAP hydrate eksik |
| Banner / ödüllü / subs? | **STUB / PARTIAL** — honesty copy var; SDK + server grant yok |
| 4 sınav + trafik cousins? | Isolation iyi; tip honesty / keepSteps / invent / YGS fen / subjectHint / stub exam-aware **shipped** |

## P0 implement status

| ID | Source | Item | Status |
|----|--------|------|--------|
| H01 | pipeline | tip-only `assisted` | **Done** |
| H02 | pipeline | Ehliyet keepSteps | **Done** |
| H03 | pipeline | generic trafik invent | **Done** |
| H04–H07 | ads/UI | honesty, Binlerce, light tabs, demo `__DEV__` | **Done** |
| H08–H10 | pipeline | subjectHint, OCR 2KB, motor lesson, YGS fen | **Done** |
| D01 | UI | home streak | **Done** |
| D03/D04 | UI | onboarding age keep + consent a11y + copy split | **Done** |
| D05 | UI | camera icon on primary CTA | **Done** |
| P0#6 | pipeline | Gemini stub exam-aware | **Done** |

## Still open (store blockers)

- AdMob SDK + server rewarded +1 grant  
- Client hydrate `subscriptionStatus`  
- Play credentials / SKUs / counsel  
- Academic normalizeSolvedBranch · enforceExamPipeline strip steps  
- Home CTA declutter · moodboard IA (D06–D10)  

## Evidence

- Canvas: `~/.cursor/projects/Users-mert-agent/canvases/cozbil-comprehensive-audit.canvas.tsx`  
- Sprint: `docs/sprint-reports/2026-07-21-comprehensive-audit-p0.md`
