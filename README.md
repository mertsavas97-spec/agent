# ÇözBil — Agent Kit + Spec Harness

Android-first AI sınav çalışma arkadaşı (**LGS · YGS · KPSS**).  
Bu repo: Spec Kit ürün kilidi + **cursor-agent-kit** koordinatör/skill paketi.

## iOS Cursor / Cloud Agent (devam)

1. Cursor iOS → Cloud Agents → repo `mertsavas97-spec/agent` → branch **`main`**
2. Prompt: `docs/agent/IOS_CONTINUE.md` içindeki kopyala-yapıştır metin
3. Detay: `SPRINT_STATE.md` → sıradaki iş Phase 1 scaffold

## Mac masaüstü (önerilen — iOS Simulator)

Eksiksiz lokal kurulum + Simulator demo:

→ **`docs/setup/DESKTOP_LOCAL_SETUP.md`**

```bash
cd ~/Desktop
git clone https://github.com/mertsavas97-spec/agent.git cozbil
cd cozbil
git checkout cursor/cozbil-polish-capture-loading-9131
bash scripts/setup-desktop-macos.sh
# apps/mobile/.env doldur, script’i tekrar çalıştır
cd apps/mobile && npx expo prebuild --platform ios && npx expo run:ios
```

Cursor’da klasör: `~/Desktop/cozbil`

## Mac Cursor (eski not)

```bash
git clone https://github.com/mertsavas97-spec/agent.git
cd agent
git checkout cursor/cozbil-polish-capture-loading-9131
cp .cursor/mcp.json.example .cursor/mcp.json   # Context7 key (opsiyonel)
```

Cursor’da klasörü aç → `docs/setup/DESKTOP_LOCAL_SETUP.md`.

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
