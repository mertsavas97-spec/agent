# Sprint report — 2026-07-23 iOS local IPA path

## Sprint Agent Raporu

**Koordinatör:** Auto (ÇözBil)
**Kullanılan ekipler:** Executor, QA
**Kullanılan skill/agent setleri:**
- `cozbil-team-skills`
- `cozbil-expo-mobile`

**Çalıştırılan lane'ler:**
- Wire `appleTeamId`, encryption export flag, Mac script + GHA macOS IPA workflow
- Attempt IPA on cloud Linux → blocked (no Xcode); owner Mac/GHA required

**Skill bypass:** Spec Kit (infra)

**QA Gate:**
- typecheck: PASS
- lint: PASS
- smoke: PASS (`build-ios-ipa-local.sh` Linux’ta net hata; Jest easProductionProfile)
- guardian: PASS

**Sonraki önerilen adım:** PR merge → Actions **iOS production IPA** (veya Mac’te `bash scripts/build-ios-ipa-local.sh`); `ascAppId` doldur → TestFlight submit.
