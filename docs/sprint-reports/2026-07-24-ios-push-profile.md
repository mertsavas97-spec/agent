# Sprint Agent Raporu — 2026-07-24 iOS Push profile

**Koordinatör:** Auto  
**Kullanılan ekipler:** Executor (docs), QA (log triage)  
**Kullanılan skill/agent setleri:** cozbil-team-skills (map), cozbil-guardian (scope: docs only)  
**Skill bypass:** Code implementation N/A — owner credential ops + runbook  
**QA Gate:** typecheck N/A / lint N/A / smoke: GHA log root-cause confirmed / guardian: exam scope untouched  
**Sonraki önerilen adım:** Owner — regenerate provisioning profile with Push; re-run Actions iOS IPA

## Özet

GHA local iOS build archive fail: App Store provisioning profile Push / `aps-environment` içermiyor. Credentials wizard’da Push sonrası profil yenilenmeli. Runbook güncellendi.
