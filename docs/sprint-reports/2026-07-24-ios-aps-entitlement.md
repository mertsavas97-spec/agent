# Sprint Agent Raporu — 2026-07-24 iOS static aps-environment

**Koordinatör:** Auto  
**Kullanılan ekipler:** Executor, QA  
**Kullanılan skill/agent setleri:** cozbil-team-skills, Expo FYI provisioning-profile-missing-capabilities  
**Skill bypass:** Superpowers TDD (config assertion only)  
**QA Gate:** Jest easProductionProfile / typecheck pending / lint N/A docs+json / guardian: exam scope OK  
**Sonraki önerilen adım:** Merge → owner `eas credentials` All (Synced capabilities Push) → re-run Actions IPA

## Özet

GHA archive hâlâ Push capability yok diyordu çünkü EAS static entitlements görmüyordu (`Synced capabilities: No updates`). `app.json` `ios.entitlements.aps-environment=production` + notifications `mode: production` eklendi.
