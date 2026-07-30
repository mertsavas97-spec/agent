# Sprint report — 2026-07-30 — AdMob iOS units

## Özet

AdMob iOS Banner / Geçiş / Ödüllü birim id’leri `eas.json` production’a bağlandı. App ID (`~`) owner export; yoksa production fail-fast.

## Sprint Agent Raporu

**Koordinatör:** Auto (ÇözBil)  
**Kullanılan ekipler:** mobile, qa  
**Kullanılan skill/agent setleri:** `cozbil-team-skills`  
**Skill bypass:** Spec Kit (ads env wiring)  
**QA Gate:** typecheck / lint / Jest easProductionProfile  
**Sonraki önerilen adım:** Owner App ID + Mac IPA

## Security follow-up (2026-07-30)

PR #31 description accidentally exposed `EXPO_PUBLIC_FIREBASE_API_KEY`. See `docs/sprint-reports/2026-07-30-secret-scrub-pr31.md`: contaminated PR closed; replacement PR opened. Owner must **rotate/restrict** the leaked Firebase browser key and dismiss the GitHub secret alert as Revoked.
