# Agent — Cursor Ajans Harness

Spec-kit + Superpowers + Context7 + ui-ux-pro-max + marketingskills + role
agent’leriyle çalışan Cursor proje iskeleti.

## Hızlı başlangıç

```bash
git clone https://github.com/mertsavas97-spec/agent.git
cd agent
cp .cursor/mcp.json.example .cursor/mcp.json
# Context7 API key'ini mcp.json içine yaz (commit etme)
```

Cursor’da klasörü aç → Superpowers plugin’inin yüklü olduğundan emin ol
(`/add-plugin superpowers`) → Agent’a görev ver.

## Zorunlu akış

1. `.specify/` + `specs/` durumuna bak
2. Yoksa: constitution → specify → clarify → plan → tasks
3. Kod: Superpowers TDD + subagent-driven-development
4. Kütüphane/API: Context7
5. UI: ui-ux-pro-max (ürün); taste/transitions sadece landing

Detay: `AGENTS.md`, `.cursor/rules/000-coordinator.mdc`

## Aktif özellik

- `specs/001-product-definition/` — ürün tipi / persona / yüzey kilidi (taslak)

## Mobil (Cursor app)

Aynı Cursor hesabıyla giriş yap → Cloud Agent / repo üzerinden bu projeyi
aç. Yerel sohbet geçmişi her zaman taşınmaz; GitHub’daki repo + Cloud Agent
mobil devam için güvenilir yoldur.
