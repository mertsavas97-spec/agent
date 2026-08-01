# Sprint report — 2026-08-01 (Android AAB foojay Plugin Portal bypass)

## Context

GHA `Android production AAB` failed on branch tip (`d221053`) during
`gradlew :app:bundleRelease`:

```
Plugin [id: 'org.gradle.toolchains.foojay-resolver-convention', version: '1.0.0']
was not found … Searched: MavenRepo, Google, Gradle Central Plugin Repository
```

Source: `node_modules/@react-native/gradle-plugin/settings.gradle.kts` (RN 0.86.0).
Same stack built successfully on `main` (2026-07-23); failure is Plugin Portal
resolve flakiness, not app code. Foojay only auto-provisions JDK toolchains —
CI/Mac already supply JDK 17.

## Fix

1. `apps/mobile/scripts/patch-rn-gradle-foojay.js` — strip the foojay `plugins {…}`
   line (idempotent).
2. Wire via `postinstall` + **`eas-build-post-install`** (critical: `.easignore`
   excludes `node_modules`, so EAS does a fresh install inside the build dir).
3. GHA: explicit patch step + `GRADLE_OPTS` auto-download=false + arm64-only.
4. Mac AAB script: explicit patch after `npm ci`.

## Owner next

1. Actions → **Android production AAB** → Run workflow  
   (branch: `cursor/home-polish-yks-ads-ocr-2914`)
2. Artifact `cozbil-android-production-aab` → Play Kapalı test (alpha)
3. versionCode will auto-bump 20→21 on success

## Sprint Agent Raporu

**Koordinatör:** Auto (Composer)
**Kullanılan ekipler:** mobile, qa, guardian
**Kullanılan skill/agent setleri:**
- `cozbil-team-skills`
- `cozbil-expo-mobile`
- `cozbil-guardian`
- `ship-gate` (partial — typecheck/lint/tests)

**Skill bypass:** Context7 (Gradle/foojay — used GitHub RN issues + Plugin Portal)

**QA Gate:**
- typecheck: PASS
- lint: PASS
- smoke: patch unit tests PASS + RN gradle-plugin `gradlew help` after strip PASS
- errors: temiz
- guardian: PASS (no product copy / exam scope change)

**Sonraki önerilen adım:** Owner re-runs GHA AAB; upload to Play alpha.
