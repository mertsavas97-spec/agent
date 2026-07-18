# Feature Specification: Product Definition Lock

**Feature Branch**: `001-product-definition`

**Created**: 2026-07-16

**Updated**: 2026-07-18

**Status**: Locked

**Input**: Owner MVP brief (ÇözBil) resolving app-vs-game, persona, and surface.

## Locked Decisions

| Decision | Value |
|----------|-------|
| Product type | **App** (education / AI study companion) |
| Working name | **ÇözBil** (final brand TBD) |
| Primary job | Fotoğraflanan LGS sorusunu adım adım Türkçe açıklar; konu eksiğini öğrenciye gösterir |
| Primary persona | LGS’ye hazırlanan 13–15 yaş öğrenci (Türkiye) |
| Secondary (non-MVP) | Veli — ödeme yapan; hesap/rapor 1.1 |
| Delivery surface | **Mobile**, Android-first |
| Positioning | “Türkiye’nin sadece LGS’ye özel AI çalışma arkadaşı — çözer, anlatır, eksiğini veliye raporlar.” (veli raporu 1.1) |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lock product identity (Priority: P1)

As the product owner, I decide whether we are building an **app** or a
**game**, name the product, and state the single primary job the product
does for its user — so the agency agents stop treating the repo as an
empty harness and share one product identity.

**Why this priority**: Constitution forbids product implementation until
product type and MVP scope are locked. Everything else depends on this.

**Independent Test**: A reviewer can open the locked definition and
answer “app or game?”, “what is the product name?”, and “what is the
primary user job?” without ambiguity.

**Acceptance Scenarios**:

1. **Given** no product identity is locked, **When** the owner completes
   the identity decision, **Then** the definition records product type
   `app`, working name `ÇözBil`, and the primary job statement above.
2. **Given** a locked identity exists, **When** an agent starts a new
   task, **Then** it treats that identity as authoritative and does not
   re-open app-vs-game unless the owner amends the constitution/spec.

---

### User Story 2 - Define target user and problem (Priority: P1)

As the product owner, I describe who the first user is and which painful
problem the MVP solves, so design and marketing skills have a concrete
audience.

**Why this priority**: Without a user and problem, UI, ASO, and MVP
scope cannot be validated.

**Independent Test**: A stranger can read the definition and correctly
restate the primary persona and the problem in one sentence each.

**Acceptance Scenarios**:

1. **Given** product identity is chosen, **When** the owner defines the
   primary persona, **Then** the definition includes LGS student 13–15,
   homework stuck moments, and need for fast step-by-step Turkish help.
2. **Given** persona and problem are defined, **When** parents are
   mentioned, **Then** they are marked non-MVP for accounts/reports
   (deferred to 1.1) while remaining the typical payer for monetization
   messaging.

---

### User Story 3 - Bound the MVP experience (Priority: P2)

As the product owner, I list the smallest set of user-visible outcomes
that make the product “real” for the first user, plus explicit
non-goals, so later plan/tasks do not balloon.

**Why this priority**: Bounds implementation cost after identity and
persona are clear.

**Independent Test**: Each MVP outcome can be demonstrated in a single
user journey; each non-goal is something a stakeholder might ask for
but is refused for v1.

**Acceptance Scenarios**:

1. **Given** persona and problem exist, **When** MVP outcomes are
   listed, **Then** they match `specs/002-cozbil-mvp/spec.md` in-scope
   outcomes and an explicit non-goals list.
2. **Given** MVP outcomes are locked, **When** someone proposes a
   feature outside that list, **Then** it is deferred to a later
   feature spec rather than silently added to v1.

---

### Edge Cases

- Owner wants “both app and game” → MUST pick a primary type for v1;
  hybrid is out of scope until a later feature amends the definition.
- Owner changes mind after lock → MUST amend this spec (new version
  note) before any conflicting implementation continues.
- Final brand differs from ÇözBil → amend working name here and in
  constitution Locked Product Identity; do not fork naming in code/UI
  without that amendment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System (project definition artifacts) MUST record a single
  product type for v1: `app`.
- **FR-002**: Definition MUST include working product name **ÇözBil** and
  a one-sentence primary job statement.
- **FR-003**: Definition MUST describe exactly one primary persona:
  LGS student ages 13–15 in Türkiye, stuck on homework questions.
- **FR-004**: Definition MUST list MVP user outcomes that are
  independently demonstrable without naming implementation technology
  (see `specs/002-cozbil-mvp/spec.md`).
- **FR-005**: Definition MUST list explicit non-goals for v1 (parent
  account/report, geometry diagrams, AI practice sessions, advanced
  gamification, spaced repetition).
- **FR-006**: Definition MUST state primary delivery surface for v1:
  mobile, Android-first.
- **FR-007**: Until FR-001–FR-006 are satisfied, agents MUST NOT start
  product implementation tasks (constitution Spec-First + Operating
  Constraints).

### Key Entities

- **Product Identity**: Type (app), working name (ÇözBil), primary job.
- **Primary Persona**: LGS student 13–15, homework context, need for
  fast Turkish step-by-step help.
- **MVP Outcome**: A user-visible result that proves the product works.
- **Non-Goal**: Explicitly deferred capability for later specs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new agent session can answer product type, name, and
  primary job correctly from the locked definition in under 1 minute.
- **SC-002**: 100% of MVP outcomes map to at least one acceptance
  scenario in `specs/002-cozbil-mvp/spec.md` (no orphan outcomes).
- **SC-003**: Stakeholder review finds zero contradictions between
  product type, persona, and MVP outcomes before implementation.
- **SC-004**: After lock, zero product-implementation tasks start
  without referencing this definition or `002-cozbil-mvp`.

## Assumptions

- Monetization freemium model is accepted for MVP messaging; exact SKU
  IDs are implementation details in the plan.
- Legal KVKK counsel is external; agents design consent flows but do not
  give legal advice.
- Language of stakeholder-facing docs may be Turkish or bilingual;
  product UI copy is Turkish.
