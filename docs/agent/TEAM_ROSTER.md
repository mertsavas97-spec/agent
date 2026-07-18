# Team Roster & Skill Map — ÇözBil

> Koordinatör her sprint/task başında bu dosyayı okur.  
> Proje router skill: `.agents/skills/cozbil-team-skills/SKILL.md`

## Ekipler

| Ekip ID | Ad | Sorumluluk | Lead skill(ler) |
|---------|-----|------------|-----------------|
| `product` | Product & Spec | Spec Kit, wording, freemium, sınav kapsamı | Spec Kit (`.cursor/skills/speckit-*`), `product-discovery`, `pricing-strategy` |
| `design` | Design & UX | Moodboard, token, onboarding UI | `$design`, `ui-design-system`, moodboard README |
| `mobile` | Mobile (RN/Expo) | Ekranlar, kamera, Firebase client | `cozbil-expo-mobile`, `senior-frontend` |
| `backend` | Functions / AI | Gemini, SafeSearch, kota, cache | `senior-fullstack`, Context7 |
| `growth` | Growth & Launch | Store, funnel, paywall | `launch-strategy`, `app-store-optimization` / `aso`, `paywall-upgrade-cro` |
| `qa` | QA & Release | Typecheck, lint, smoke | `ship-gate`, `code-reviewer` |
| `guardian` | Product Guardian | Scope, çocuk dili, exam messaging | `cozbil-guardian`, `adversarial-reviewer` |
| `architect` | Mimari (rol) | Veri modeli, klasör yapısı | `.cursor/rules/roles/architect.mdc` + Context7 |
| `security` | Security (rol) | Abuse, KVKK akışı | `.cursor/rules/roles/security-reviewer.mdc` |

## OMX (`.codex/skills/`)

| Skill | Ne zaman |
|-------|----------|
| `$plan` / `$ralplan` | Epic, mimari, sprint planı |
| `$deep-interview` | Belirsiz istek |
| `$design` | UI/ürün tasarım contract |
| `$analyze` | Read-only repo analizi |
| `$ralph` / `$team` | Paralel çok dosyalı iş |
| `$code-review` | Diff review |
| `$ask` | Harici ikinci görüş (CLI varsa) |

## Domain (`.agents/skills/`) — ÇözBil sık kullanılanlar

`cozbil-team-skills`, `cozbil-expo-mobile`, `cozbil-guardian`,
`product-discovery`, `ui-design-system`, `senior-frontend`, `senior-fullstack`,
`ship-gate`, `code-reviewer`, `paywall-upgrade-cro`, `launch-strategy`,
`app-store-optimization`, `pricing-strategy`, `dependency-auditor`

Tam liste: `.agents/skills/*/SKILL.md` (cursor-agent-kit bootstrap).

## Spec Kit (zorunlu ürün yolu)

constitution → specify → clarify → plan → tasks → implement  
Aktif: `specs/002-cozbil-mvp/`

## Routing

1. Önce `cozbil-team-skills` route table.
2. Skill eşleşmesi varsa → `SKILL.md` oku → uygula.
3. Yoksa → skill bypass (typo, tek satır).
4. QA Gate her kapanışta (`docs/agent/COORDINATOR.md`).
5. Guardian: eğitim/çocuk/yasal copy’de veto.
6. Kullanıcıya sadece Koordinatör konuşur.
