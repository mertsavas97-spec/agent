<!--
Sync Impact Report
- Version change: 1.1.0 → 1.1.1
- Modified principles: none renamed; Locked Product Identity amended
  (multi-exam: LGS + YGS + KPSS; was LGS-only)
- Added sections: none
- Removed sections: none
- Templates: no structural change
- AGENTS.md / specs/001 / specs/002 / docs/design/moodboard — ✅ updated
- Follow-up TODOs: Final brand/store name; KVKK legal counsel; per-exam
  topic catalogs for YGS and KPSS beyond math-first MVP
-->

# Agent Constitution

## Core Principles

### I. Spec-First (NON-NEGOTIABLE)

Every feature MUST complete the Spec Kit path before implementation:
constitution (project-level) → specify → clarify (when needed) → plan →
tasks → implement. The coordinator MUST check `.specify/` (and active
`specs/`) at the start of every task. If no feature spec/plan/tasks exist
for the work, Spec Kit steps MUST run first. Ad-hoc coding without a
current feature directory is forbidden.

**Rationale**: Prevents scope drift and keeps agent roles aligned to a
single source of truth.

### II. Skill-Grounded Execution (NON-NEGOTIABLE)

No task MAY proceed from unaided model memory alone. Work MUST ground in
at least one approved source: Spec Kit (`.specify/`), Superpowers skills,
Context7 (libraries/APIs), ui-ux-pro-max (product UI/UX), marketingskills
(growth/ASO/marketing copy), or alirezarezvani bundles (business/PM/
finance). If a required source is missing or fails, the agent MUST stop
and report the gap instead of inventing substitutes.

**Rationale**: This repo is an agency harness; quality depends on
deterministic skill use, not improvisation.

### III. Test-First Delivery (NON-NEGOTIABLE)

Implementation MUST follow Superpowers test-driven-development:
failing tests first, then minimal code to pass, then refactor.
Subagent-driven-development MUST be used for multi-step features.
Verification-before-completion MUST gate "done" claims. Shipping without
evidence of tests passing is a constitution violation.

**Rationale**: Agents over-claim completion; TDD and verification make
progress falsifiable.

### IV. Verified Dependencies & Contracts

Library and API usage MUST be validated through Context7 (or the
library's current official docs when Context7 is unavailable) before
code is written. Invented APIs, guessed method signatures, and stale
training-data APIs are forbidden. Shared contracts (schemas, public
interfaces) MUST have tests covering consumer/provider expectations.

**Rationale**: Hallucinated APIs create silent breakage; verification is
cheap compared to rework.

### V. Role Separation & Simplicity

Work MUST be delegated to the matching role persona under
`.cursor/rules/roles/`: architect (structure/decisions), designer
(UI/UX), executor (code), qa-tester (validation), security-reviewer
(security). Parallel work MUST use `worktree.json` and Cursor parallel
agents with an explicit role each. Prefer the smallest design that
satisfies the current spec (YAGNI). Complexity MUST be justified in the
plan or a decision record.

**Rationale**: Clear roles reduce conflicting changes; simplicity keeps
specs implementable.

## Agent Operating Constraints

- Product UI/UX decisions MUST use ui-ux-pro-max (mobile stacks supported:
  React Native / SwiftUI / Flutter as applicable).
- taste-skill and transitions.dev MUST be used only for marketing sites /
  landing pages — never for the core product UI.
- Growth, ASO, and marketing copy MUST use marketingskills.
- Business, management, and finance topics MUST use alirezarezvani
  bundles.
- Product type (app vs game) and MVP scope MUST be locked in Spec Kit
  before any product implementation begins.
- Sprint memory lives in `docs/sprint-reports/`; `/sprint-report` MUST
  produce a dated report using the coordinator template.

### Locked Product Identity

- **Product type (v1)**: App (education / study companion) — not a game.
- **Working name**: ÇözBil (final store/domain name TBD; agents MUST treat
  this as the working brand until amended).
- **Primary job**: Help exam candidates in Türkiye solve photographed
  questions with step-by-step Turkish explanations, and surface topic
  weaknesses.
- **Exam scope (MVP)**: **LGS, YGS, and KPSS** are all first-class selectable
  exam tracks (not “coming soon”). Topic catalogs and prompts MUST be
  exam-aware.
- **Primary persona**: Sınava hazırlanan öğrenci/aday (LGS: typically 13–15;
  YGS: lise/üniversite öncesi; KPSS: yetişkin aday). Payer may be parent
  (esp. LGS) or the candidate; parent account/report is post-MVP 1.1.
- **Primary surface**: Mobile, Android-first.
- **Design reference**: `docs/design/moodboard/` (MVP moodboard + tokens).
- **Authoritative MVP feature dir**: `specs/002-cozbil-mvp/`.

## Delivery Workflow

1. Coordinator reads active `.specify/` + `specs/` state.
2. Missing artifacts → run the next Spec Kit command (do not skip ahead).
3. Design → designer + ui-ux-pro-max; architecture → architect;
   implement → executor + Superpowers; verify → qa-tester;
   security-sensitive changes → security-reviewer.
4. Library/API questions → Context7 before coding.
5. User-facing "done" requires verification evidence (tests, checklist,
   or QA report).
6. On user request for sprint report → write
   `docs/sprint-reports/<YYYY-MM-DD>.md` and summarize in Turkish.

## Governance

This constitution supersedes informal chat instructions when they
conflict. Amendments MUST: (1) update `.specify/memory/constitution.md`,
(2) bump **Version** using semver (MAJOR = principle removal/redefinition;
MINOR = new principle or material expansion; PATCH = clarification),
(3) set **Last Amended** to the amendment date (ISO `YYYY-MM-DD`),
(4) refresh dependent templates/guidance listed in the Sync Impact
Report, (5) note the change in the next sprint report.

Compliance: every plan's Constitution Check MUST pass before research/
design proceeds. PRs and agent handoffs SHOULD cite which principles
were exercised. Unjustified complexity or skipped Spec Kit / skill steps
MUST be rejected and sent back to the prior phase.

Runtime guidance: `AGENTS.md` and `.cursor/rules/000-coordinator.mdc`.

**Version**: 1.1.1 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-18
