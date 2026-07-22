# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-07-22
- Primary product surfaces: Expo RN app (`apps/mobile`) — Android-first
- Evidence reviewed: `docs/design/moodboard/`, `docs/design/premium-polish-brief.md`,
  `docs/design/home-redesign-v2-brief.md`, `apps/mobile/src/theme/tokens.ts`,
  all `app/` routes + feature screens (home, solve, paywall, onboarding, topics, history, stats, profile)

## Brand
- Personality: Calm, trustworthy study partner — warm AI friend, not a game
- Trust signals: Navy + orange moodboard lock, robot mark, honest transparency copy
- Avoid: Purple AI clichés, cream+terracotta AI defaults, neon glow spam, emoji clutter,
  shaming copy, “%100 doğru” overclaims, taste-skill/transitions.dev in product UI

## Product goals
- Goals: Photo → stepped Turkish solution feels premium and reliable before 1.0
- Non-goals: Veli rapor, geometry render, iOS-first, marketing landing polish
- Success signals: One clear composition per screen; press feedback; calendar streak;
  exam mode always obvious; loading never looks like a demo template

## Personas and jobs
- Primary personas: LGS / YGS / KPSS / Ehliyet candidates (teen → adult)
- User jobs: Capture question, get steps, switch exam mode, track streak/weak topics
- Key contexts: Phone camera in noisy light; dogfood tunnels; freemium daily limit

## Information architecture
- Primary navigation: Ana Sayfa / Konular / Geçmiş / İstatistik / Profil
- Core routes: onboarding → home → capture-confirm → analyzing → solution / exam-block / paywall
- Content hierarchy: Brand → primary CTA → exam mode → secondary tools → recent

## Design principles
- Brand first on home; one job per section
- Tokens only — no ad-hoc hex in product chrome
- Press + haptic on every primary action
- Motion = presence (2–3 intentional loops), never decorative blob fields
- Tradeoffs: Android-first density over desktop marketing layouts

## Visual language
- Color: Navy `#1E1B4B`, Orange `#F59E0B`, surface `#F5F6FA`, soft navy/orange fills;
  per-exam accents in `examTheme` (teal/amber/blue/red) for mode clarity
- Typography: Poppins Regular/Medium/SemiBold/Bold with typed scale (`text.*`)
- Spacing: 4–8–16–24–32 rhythm (`space.*`)
- Shape: radii sm→xl + pill; circular brand plates on loading
- Motion: `motion.fast/normal/slow` + easeOut; reduced-motion → static
- Imagery: Robot mark SSoT; worksheet photos as content not decoration

## Components
- Reuse: `SegmentedTabs`, `Eyebrow`, `EmptyState`, `CozbilRobot`, `CatalogBreadcrumb`
- New/changed: `Button`, `PressableSurface`, `screenHeaderOptions`, expanded tokens
- Variants: primary / secondary / ghost / danger; sm/md/lg
- Ownership: `apps/mobile/src/theme` + `apps/mobile/src/ui`

## Accessibility
- Target: WCAG AA contrast on navy/orange/white
- Touch targets ≥ 44pt on primary CTAs
- Screen-reader labels on capture/gallery/exam switcher
- Reduced motion: skip orbit/halo loops when system preference set (best-effort)

## Responsive behavior
- Phone-first; tablets keep single-column product flows
- Tab bar fixed 5 items; avoid dashboard density on home first viewport

## Interaction states
- Loading: AnalyzingView (premium) or soft ActivityIndicator — never blank
- Empty: EmptyState + optional CTA
- Error: clear title + body + primary back action via Button
- Success: solution answer hero elevated
- Disabled: `interaction.disabledOpacity`
- Pressed: `interaction.pressedOpacity` on Button/PressableSurface

## Content voice
- Neutral Turkish; teacher-like; no shame
- Exam labels: LGS / YGS / KPSS / Ehliyet
- Pricing SSoT elsewhere; UI must not invent prices

## Implementation constraints
- Expo RN + StyleSheet tokens (no Tailwind)
- Moodboard HEX locked
- No new native modules for this polish pass
- Tests: theme tokens, Button smoke, home/solution smoke keep testIDs

## Open questions
- [ ] Dark mode full surfaces — deferred post-1.0 (tabs force light)
- [ ] BannerSlot real ads visual — placeholder stays quiet until SDK
