# Feature Specification: Product Definition Lock

**Feature Branch**: `001-product-definition`

**Created**: 2026-07-16

**Status**: Draft

**Input**: User description: "spec-kit ile projeye başla — ürün tipini, hedef kullanıcıyı ve MVP kapsamını netleştirerek implementasyon öncesi ürün tanımını kilitle"

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
   (app or game), working name, and one-sentence primary job.
2. **Given** a locked identity exists, **When** an agent starts a new
   task, **Then** it treats that identity as authoritative and does not
   re-open app-vs-game unless the owner amends the constitution/spec.

---

### User Story 2 - Define target user and problem (Priority: P1)

As the product owner, I describe who the first user is and which painful
problem (or fun desire, for a game) the MVP solves, so design and
marketing skills have a concrete audience.

**Why this priority**: Without a user and problem, UI, ASO, and MVP
scope cannot be validated.

**Independent Test**: A stranger can read the definition and correctly
restate the primary persona and the problem/desire in one sentence each.

**Acceptance Scenarios**:

1. **Given** product identity is chosen, **When** the owner defines the
   primary persona, **Then** the definition includes persona name/role,
   context of use, and the problem or desire addressed.
2. **Given** persona and problem are defined, **When** a secondary
   audience is mentioned, **Then** it is marked non-MVP (out of scope
   for v1) or explicitly deferred.

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
   listed, **Then** there are 3–7 testable user outcomes and a non-goals
   list.
2. **Given** MVP outcomes are locked, **When** someone proposes a
   feature outside that list, **Then** it is deferred to a later
   feature spec rather than silently added to v1.

---

### Edge Cases

- Owner wants “both app and game” → MUST pick a primary type for v1;
  hybrid is out of scope until a later feature amends the definition.
- Owner changes mind after lock → MUST amend this spec (new version
  note) before any conflicting implementation continues.
- Persona is “everyone” → MUST narrow to one primary persona for MVP.
- No monetization decision yet → Allowed for this feature; monetization
  is deferred unless it changes MVP outcomes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System (project definition artifacts) MUST record a single
  product type for v1: `app` or `game`.
- **FR-002**: Definition MUST include a working product name and a
  one-sentence primary job statement.
- **FR-003**: Definition MUST describe exactly one primary persona
  (role, context, and motivating problem or desire).
- **FR-004**: Definition MUST list MVP user outcomes that are
  independently demonstrable without naming implementation technology.
- **FR-005**: Definition MUST list explicit non-goals for v1.
- **FR-006**: Definition MUST state primary delivery surface for v1
  (e.g. mobile, web, desktop) at a product level — not a tech stack.
- **FR-007**: Until FR-001–FR-006 are satisfied, agents MUST NOT start
  product implementation tasks (constitution Spec-First + Operating
  Constraints).
- **FR-008**: Product type is [NEEDS CLARIFICATION: app mı yoksa oyun
  mu? — v1 için tek birincil tip seçilmeli].
- **FR-009**: Primary persona and problem/desire are
  [NEEDS CLARIFICATION: kim için, hangi acı veya eğlence ihtiyacı?].
- **FR-010**: Primary delivery surface is
  [NEEDS CLARIFICATION: v1 yüzey — mobil, web, masaüstü, veya başka?].

### Key Entities

- **Product Identity**: Type (app|game), working name, primary job.
- **Primary Persona**: Who uses it first, in what context, why they care.
- **MVP Outcome**: A user-visible result that proves the product works.
- **Non-Goal**: Explicitly deferred capability for later specs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new agent session can answer product type, name, and
  primary job correctly from the locked definition in under 1 minute.
- **SC-002**: 100% of MVP outcomes map to at least one acceptance
  scenario in a subsequent feature spec (no orphan outcomes).
- **SC-003**: Stakeholder review finds zero contradictions between
  product type, persona, and MVP outcomes before `/speckit-plan`.
- **SC-004**: After lock, zero product-implementation tasks start
  without referencing this definition (spot-check next sprint report).

## Assumptions

- This feature produces definition artifacts under Spec Kit (`specs/`),
  not shipping product code.
- Monetization, legal entity, and brand system are out of scope unless
  they block MVP outcome selection.
- Language of stakeholder-facing definition may be Turkish or English;
  consistency within the locked doc is required.
- After clarifications are resolved, a follow-up `/speckit-clarify` or
  direct spec update will remove remaining ambiguity before plan.
