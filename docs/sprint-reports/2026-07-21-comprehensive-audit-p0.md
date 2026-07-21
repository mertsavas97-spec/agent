# Sprint report — Comprehensive audit + P0 honesty fixes

**Date:** 2026-07-21  
**Branch context:** launch-audit / post–Wave A  
**Agents:** Koordinatör · explore×3 (UI, ads/IAP, pipeline) · designer/architect/qa lens  
**Skills:** canvas · cozbil-guardian · ship-gate · Spec Kit

## Verdict

| Gate | Status |
|------|--------|
| Store launch | **NO-GO** (ads stub, IAP creds, counsel) |
| Dogfood | **PARTIAL-GO** (honesty P0s shipped) |

## Direct answers (user)

1. **UI/UX eksikleri** — Evet, listelendi: [audit](../audits/mvp-1.0-comprehensive-audit-2026-07-21.md) + [canvas](file:///Users/mert/.cursor/projects/Users-mert-agent/canvases/cozbil-comprehensive-audit.canvas.tsx)
2. **Ayarlar** — Push delivery yok (prefs only); demo replay artık yalnız `__DEV__`; sınav değişimi stub reklamı açıkça söylüyor
3. **Ads / banner / rewarded / subs** — Banner honesty; rewarded +1 server hâlâ yok; IAP path var, Play hydrate eksik
4. **4 sınav + trafik bug cousins** — Isolation OK; tip=`assisted`, cross-branch keepSteps kapandı, generic invent kaldırıldı, YGS fen dead zone açıldı, subjectHint + OCR 2KB

## Implemented (this sprint)

- `assisted` flag + SolutionScreen banner  
- Ehliyet `applySubjectOverride` exact-subject keepSteps  
- Remove generic trafik safety invent  
- Proxy `subjectHint` + OCR preview 2048  
- YGS physics/chemistry/biology classify  
- Motor/güç aktarma topic lesson  
- Paywall “Binlerce…” removed  
- Force light tab chrome  
- Settings ads/push honesty + hide demo replay in release  

## Still open (P1)

- AdMob SDK + server rewarded grant  
- Client hydrate `subscriptionStatus`  
- Academic normalizeSolvedBranch (LGS/YGS/KPSS)  
- Home streak / CTA declutter / full moodboard  
- EAS / listing (Sprint 4 — not started)

## Follow-up (late explore agents)

Agents: [UI/UX](246da897-89e5-48d0-8515-7aa822e9661c) · [Settings/Ads/IAP](e55957d3-a7dc-460d-b360-4aa03d161f4d) · [Pipeline](23d80a9d-414e-4628-88ec-016a08b49746)

Additional P0 after reconcile:
- Home streak chip + camera CTA icon  
- Onboarding: keep age on exam switch · consent checkbox a11y · under13 vs 13–17 copy  
- Gemini stub exam-aware (no LGS math under YGS/KPSS/Ehliyet)  
- Solution meta label `YGS` (not YGS (YKS))  
