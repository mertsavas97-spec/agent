# Sprint Raporu - 2026-07-18 (Phase 1 scaffold)

## Kullanilan repo/skill setleri
- Spec Kit: `specs/002-cozbil-mvp/tasks.md` T001–T006
- `cozbil-team-skills` → mobile lane
- `cozbil-expo-mobile` (Expo 57 tabs scaffold)
- `cozbil-guardian` (exam scope check)
- Context7: MCP yok — Expo create-expo-app official CLI
- ui-ux-pro-max: CLI yok → moodboard tokens (`docs/design/tokens.md`)

## Kullanilan ekipler
- mobile: Expo app + Jest
- design: theme tokens
- backend: functions ping + examTypes
- qa: typecheck + test gate
- guardian: scope

## Alinan kararlar
- Expo SDK ~57, expo-router tabs: Ana Sayfa / Geçmiş / İstatistik / Profil
- Root scripts: `npm run typecheck|lint|test|qa`
- Firebase emulator config + deny-all rules stubs

## QA Gate
- typecheck: PASS
- lint: N/A (echo stub)
- smoke: PASS (5 jest tests)
- errors: temiz
- guardian: PASS

## Acik / bekleyen
- Phase 2 Auth + rules + topic catalogs
- ESLint kurulumu
- Gerçek Firebase/GCP proje bağlama
