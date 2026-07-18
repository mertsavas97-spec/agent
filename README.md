# ÇözBil — Agent Kit + Spec Harness

Android-first AI sınav çalışma arkadaşı (**LGS · YGS · KPSS**).  
Bu repo: Spec Kit ürün kilidi + **cursor-agent-kit** koordinatör/skill paketi.

## Hızlı başlangıç (Mac Cursor)

```bash
git clone https://github.com/mertsavas97-spec/agent.git
cd agent
git checkout cursor/cozbil-mvp-spec-9131   # veya main (PR merge sonrası)
cp .cursor/mcp.json.example .cursor/mcp.json   # Context7 key
```

Cursor’da klasörü aç → `docs/agent/OPENING_PROMPT.md` içeriğini yapıştır.

## Koordinatör modeli

Sen → **Koordinatör** → product / design / mobile / backend / growth / qa / guardian  
Skill map: `docs/agent/TEAM_ROSTER.md` · Router: `.agents/skills/cozbil-team-skills`

## Kit sync

```bash
bash scripts/sync-cursor-agent-kit.sh
```

Kaynak: https://github.com/mertsavas97-spec/cursor-agent-kit.git

## Aktif özellik

- `PROJECT_BRIEF.md` — ürün sınırları
- `specs/001-product-definition/` — Locked
- `specs/002-cozbil-mvp/` — MVP spec/plan/tasks
- `docs/design/moodboard/` — UI referansı
- `.agents/skills/` — kit domain skills + `cozbil-*`
- `.codex/skills/` — OMX workflows (`$plan`, `$ralplan`, …)

## Zorunlu akış

1. Spec Kit durumu  
2. Skill map / SKILL.md  
3. Implement (TDD)  
4. **QA Gate** (typecheck + lint + smoke)  
5. Sprint Agent Raporu  
