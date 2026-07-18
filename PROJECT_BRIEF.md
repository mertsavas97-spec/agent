# Project Brief — ÇözBil

## One-liner

Türkiye’de **LGS, YGS ve KPSS** adaylarına fotoğrafla soru çözüp adım adım
Türkçe anlatan AI çalışma arkadaşı (Android-first).

## v1 scope IN

- Fotoğrafla soru çözme + SafeSearch + adım adım çözüm
- “Anlamadım, tekrar açıkla”
- Onboarding: LGS / YGS / KPSS (üçü aktif)
- Geçmiş, istatistik/zayıflık, streak
- Freemium (5/gün) + paywall
- Moodboard UI: navy `#1E1B4B`, orange `#F59E0B`, Poppins, robot loading

## v1 scope OUT

- Veli hesabı / haftalık rapor (1.1)
- Geometri diyagram render, AI pratik session, spaced repetition (1.2)
- iOS birincil lansman

## Monetization

Freemium → Premium (~49 TL/ay vitrin); günlük 5 ücretsiz soru.

## Design north star

`docs/design/moodboard/`

## Spec Kit

- Identity lock: `specs/001-product-definition/`
- MVP: `specs/002-cozbil-mvp/` (spec → plan → tasks)
- Constitution: `.specify/memory/constitution.md`

## Agent model

Koordinatör tek muhatap → `docs/agent/COORDINATOR.md`  
Skill map → `docs/agent/TEAM_ROSTER.md` + `.agents/skills/cozbil-team-skills/`
