const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  patchFoojaySettings,
  MARKER,
} = require('../scripts/patch-rn-gradle-foojay');

const SAMPLE = `pluginManagement {
  repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
  }
}

plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0") }

include(
    ":react-native-gradle-plugin",
)
`;

describe('patch-rn-gradle-foojay', () => {
  it('removes the foojay-resolver-convention plugins line', () => {
    const result = patchFoojaySettings(SAMPLE);
    expect(result.changed).toBe(true);
    expect(result.alreadyPatched).toBe(false);
    expect(result.contents).toContain(MARKER);
    expect(result.contents).not.toMatch(
      /foojay-resolver-convention["']\)\.version/,
    );
    expect(result.contents).toContain('include(');
  });

  it('is idempotent when marker already present', () => {
    const once = patchFoojaySettings(SAMPLE);
    const twice = patchFoojaySettings(once.contents);
    expect(twice.changed).toBe(false);
    expect(twice.alreadyPatched).toBe(true);
    expect(twice.contents).toBe(once.contents);
  });

  it('no-ops when the plugins line is absent', () => {
    const bare = 'include(":react-native-gradle-plugin")\n';
    const result = patchFoojaySettings(bare);
    expect(result.changed).toBe(false);
    expect(result.alreadyPatched).toBe(false);
    expect(result.contents).toBe(bare);
  });

  it('CLI patches a temp copy of the RN settings file', () => {
    const tmp = path.join(os.tmpdir(), `cozbil-foojay-${Date.now()}.kts`);
    fs.writeFileSync(tmp, SAMPLE);
    try {
      const script = path.join(__dirname, '..', 'scripts', 'patch-rn-gradle-foojay.js');
      const run = spawnSync(process.execPath, [script, tmp], { encoding: 'utf8' });
      expect(run.status).toBe(0);
      const patched = fs.readFileSync(tmp, 'utf8');
      expect(patched).toContain(MARKER);
      expect(patched).not.toMatch(
        /plugins\s*\{\s*id\(["']org\.gradle\.toolchains\.foojay/,
      );
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('package.json wires postinstall + eas-build-post-install to the patcher', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json');
    expect(pkg.scripts.postinstall).toContain('patch-rn-gradle-foojay');
    expect(pkg.scripts['eas-build-post-install']).toContain('patch-rn-gradle-foojay');
  });
});
