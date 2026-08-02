#!/usr/bin/env node
/**
 * Strip foojay-resolver-convention from @react-native/gradle-plugin settings.
 *
 * Why: EAS/GHA Android builds resolve that settings plugin from the Gradle
 * Plugin Portal. Intermittent "Plugin … was not found" failures abort
 * `:app:bundleRelease` before any app code compiles (seen 2026-08-01 on
 * ubuntu-latest + Gradle 9.3.1 + RN 0.86.0).
 *
 * Foojay only auto-downloads JDKs for toolchains. CI/Mac already provide
 * JDK 17 (setup-java / Temurin), so the convention plugin is unnecessary.
 *
 * Applied via:
 * - npm `postinstall` (local / GHA `npm ci`)
 * - npm `eas-build-post-install` (EAS worker after fresh install; node_modules
 *   is easignored so the archive cannot carry a pre-patch)
 * - explicit calls in GHA workflow + Mac AAB scripts
 *
 * Idempotent — safe to run multiple times.
 */
const fs = require('fs');
const path = require('path');

const MARKER = 'cozbil-skip-foojay-resolver';
const PLUGIN_LINE_RE =
  /^\s*plugins\s*\{\s*id\(["']org\.gradle\.toolchains\.foojay-resolver-convention["']\)\.version\(["'][^"']+["']\)\s*\}\s*$/m;

/**
 * @param {string} contents
 * @returns {{ contents: string, changed: boolean, alreadyPatched: boolean }}
 */
function patchFoojaySettings(contents) {
  if (contents.includes(MARKER)) {
    return { contents, changed: false, alreadyPatched: true };
  }
  if (!PLUGIN_LINE_RE.test(contents)) {
    return { contents, changed: false, alreadyPatched: false };
  }
  const next = contents.replace(
    PLUGIN_LINE_RE,
    `// ${MARKER}: JDK provided by CI/local JAVA_HOME — skip Plugin Portal resolve\n`,
  );
  return { contents: next, changed: next !== contents, alreadyPatched: false };
}

function defaultSettingsPath() {
  return path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native',
    'gradle-plugin',
    'settings.gradle.kts',
  );
}

function main() {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : defaultSettingsPath();
  if (!fs.existsSync(target)) {
    console.warn(`[${MARKER}] skip — missing ${target}`);
    process.exit(0);
  }
  const original = fs.readFileSync(target, 'utf8');
  const result = patchFoojaySettings(original);
  if (result.alreadyPatched) {
    console.log(`[${MARKER}] already patched: ${target}`);
    return;
  }
  if (!result.changed) {
    console.warn(`[${MARKER}] no foojay plugins line in ${target} (RN layout changed?)`);
    return;
  }
  fs.writeFileSync(target, result.contents);
  console.log(`[${MARKER}] patched: ${target}`);
}

if (require.main === module) {
  main();
}

module.exports = { patchFoojaySettings, MARKER, PLUGIN_LINE_RE };
