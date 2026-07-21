# Agent Operating Contract — ÇözBil

<!-- KOORDINATOR:START -->
**Varsayılan mod:** Bu repoda konuştuğunda **Koordinatör** rolündesin
(`docs/agent/COORDINATOR.md`).

- İstekleri ekiplere dağıt (`docs/agent/TEAM_ROSTER.md` +
  `.agents/skills/cozbil-team-skills`).
- İlgili skill varsa `SKILL.md` oku ve uygula; zorunlu değilse normal execution.
- Her anlamlı task sonunda **Sprint Agent Raporu** yaz.
- Her sprint/task kapanışında **QA Gate** geçmeden işi bitmiş sayma.
<!-- KOORDINATOR:END -->

## Ürün kilidi

**ÇözBil** — eğitim uygulaması (oyun değil). Sınavlar: **LGS + YGS + KPSS + Ehliyet**.
Android-first. Moodboard: `docs/design/moodboard/`.  
Spec: `specs/001-product-definition/` (Locked) + `specs/002-cozbil-mvp/`.

## Spec-First (zorunlu)

1. `.specify/` + aktif `specs/` durumuna bak.
2. Eksikse: constitution → specify → clarify → plan → tasks.
3. Kod: Superpowers TDD + subagent-driven-development.
4. Kütüphane/API: Context7 (hafızadan API yok).
5. Ürün UI: ui-ux-pro-max + moodboard; taste/transitions yalnız landing.
6. Growth/ASO: marketingskills / kit growth skill’leri.

## Skill invocation

- `$skill` → `.codex/skills/<name>/SKILL.md`
- Domain skill → `.agents/skills/<name>/SKILL.md`
- Proje skill → `.agents/skills/cozbil-*/SKILL.md`
- Spec Kit → `.cursor/skills/speckit-*/SKILL.md`
- Roller → `.cursor/rules/roles/*.mdc`

## Verification (QA Gate — zorunlu)

1. `npm run typecheck` veya eşdeğeri (yoksa gerekçeli N/A)
2. `npm run lint` (varsa)
3. Kritik path smoke
4. Yeni console/crash yok
5. `cozbil-guardian` — scope/copy/exam drift

**FAIL → düzelt → tekrar doğrula → sonra rapor.**

## Docs

| Dosya | Amaç |
|-------|------|
| `PROJECT_BRIEF.md` | Ürün sınırları |
| `docs/agent/TEAM_ROSTER.md` | Ekip ↔ skill map |
| `docs/agent/COORDINATOR.md` | Koordinatör protokolü |
| `docs/agent/OPENING_PROMPT.md` | İlk chat prompt |
| `SPRINT_STATE.md` | Aktif sprint |
| `docs/sprint-reports/` | Tarih damgalı hafıza |
| `.cursor-agent-kit.json` | Kit bootstrap marker |

## iOS / Cloud devam

Sohbet taşınmaz. Repo + `docs/agent/IOS_CONTINUE.md` kullan.
Aktif hedef: `SPRINT_STATE.md`.

### Cursor Mobile / Cloud Agents

- Repo: `mertsavas97-spec/agent` (GitHub App bağlı olmalı)
- Ortam: `.cursor/environment.json` → `apps/mobile` + `functions` + `solve-proxy` install
- Cloud VM’de **Metro / fiziksel cihaz yok** — dogfood için Desktop veya Remote Control
- Secrets: Cursor Cloud dashboard (chat’e key yapıştırma)
- AI: Functions’ta `COZBIL_USE_VERTEX=1` (Startup/Cloud Billing); AI Studio prepaid kullanma

## Kit kaynağı

https://github.com/mertsavas97-spec/cursor-agent-kit.git  
Sync: `scripts/sync-cursor-agent-kit.sh`
