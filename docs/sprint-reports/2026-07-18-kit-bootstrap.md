# Sprint Raporu - 2026-07-18 (cursor-agent-kit bootstrap)

## Kullanilan repo/skill setleri
- cursor-agent-kit: bootstrap from github.com/mertsavas97-spec/cursor-agent-kit
- agents skills: ~278 (taksitdefter-* stripped; cozbil-* eklendi)
- codex skills: 30
- spec-kit: korundu (constitution 1.1.1, 001/002)
- cozbil-team-skills / cozbil-expo-mobile / cozbil-guardian: yeni
- superpowers / context7 / ui-ux-pro-max: bu turda kod yok

## Kullanilan agent rolleri / ekipler
- coordinator: kit kurulum + ÇözBil rename/adapt
- product: PROJECT_BRIEF + TEAM_ROSTER
- guardian: taksitdefter drift temizliği, exam scope koruma
- architect / designer / executor / qa-tester: N/A (scaffold sonraki)

## Alinan kararlar
- Kit skills `.agents/skills` + `.codex/skills` altına yüklendi
- Yabancı proje skill’leri (taksitdefter-*, workspace-guardian) silindi
- İsimler ÇözBil’e çekildi; sync script eklendi
- Çift koordinatör kuralı hizalandı: `koordinator.mdc` + `000-coordinator.mdc`

## QA Gate
- typecheck: N/A (apps/mobile yok)
- lint: N/A
- smoke: PASS (path/count doğrulama)
- errors: temiz
- guardian: PASS

## Acik / bekleyen isler
- tasks.md Phase 1 Expo scaffold
- Mac’te OPENING_PROMPT ile oturum
