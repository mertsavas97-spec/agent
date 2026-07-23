# ÇözBil — Store submission readiness (refresh)

**Date:** 2026-07-23 (refresh after P0–P2 agent closeout + AdMob scaffold)  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**Prior:** `store-submission-readiness-2026-07-23.md` (initial)

**Overall verdict:** **NO-GO** production submit until owner ops.  
**Dogfood / internal after owner Sprint A:** **GO-candidate**.

---

## Scorecard (0–100) — refresh

| Alan | Önce | Şimdi | Not |
|------|-----:|------:|-----|
| Ürün kapsamı | 88 | **90** | 4 sınav + konu/ö dül akışları |
| UI / UX | 78 | **80** | Review prompt + greeting polish |
| Mobil kod / test / lint | 72 | **84** | Jest 260+; ESLint app/src; CI |
| EAS / native iskelet | 55 | **68** | AdMob plugin; iOS submit placeholder; projectId hâlâ boş |
| Production solve | 42 | **48** | Proxy gated; deploy/smoke owner |
| Play IAP | 48 | **58** | Honest UX + sync; Console SKU/secret owner |
| App Store IAP | 22 | **40** | StoreKit stub + platform=ios; full API owner |
| AdMob / ads | 35 | **62** | SDK scaffold + hide-without-units; canlı unit owner |
| Legal / KVKK | 50 | **62** | /terms artefact; counsel + hosting deploy owner |
| Listing varlıkları | 40 | **40** | Screenshots/feature graphic sen |
| Push | 60 | **70** | Local + permissions + privacy hizası |
| **Android production submit** | 38 | **52** | Hâlâ NO-GO (owner) |
| **Android internal test** | 52 | **72** | Owner Sprint A sonrası gerçekçi |
| **iOS App Store** | 28 | **38** | Stub var; ASC/full verify sonra |
| **Dogfood preview** | 70 | **78** | |

**Okuma:** 80+ store-ready · 60–79 soft-launch · owner Sprint A → internal ~72+.

---

## Blockers (production)

1. `eas init` (owner/projectId)  
2. Functions deploy + Play billing secret  
3. Play SKU + internal track  
4. Hosting deploy privacy+terms  
5. Prod solve smoke (proxy’siz)  
6. Counsel + listing görselleri (production track)

Owner checklist: `docs/store/OWNER_OPS_STORE_READY.md`

---

## Sprint Agent Raporu

**Koordinatör:** Auto  
**QA Gate:** typecheck/lint/jest PASS (bkz. sprint report)  
**Sonraki:** Owner Sprint A
