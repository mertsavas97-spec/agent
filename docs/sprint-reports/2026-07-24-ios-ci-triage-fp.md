# Sprint Agent Raporu — 2026-07-24 iOS CI triage false positive

**Koordinatör:** Auto  
**Kullanılan ekipler:** Executor, QA  
**Kullanılan skill/agent setleri:** cozbil-team-skills  
**Skill bypass:** Superpowers (CI triage only)  
**QA Gate:** log review PASS (credentials ready + ExpoModulesJSI fail) / guardian N/A  
**Sonraki önerilen adım:** Merge → Mac `--local` IPA (GHA SPM flaky)

## Özet

Triage, her non-interactive build’de çıkan `Distribution Certificate is not validated` uyarısını credentials fail sanıyordu. Asıl hata ExpoModulesJSI SPM. Regex/order düzeltildi.
