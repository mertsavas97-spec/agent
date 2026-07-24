/**
 * @jest-environment node
 */
const {
  injectOpenIapCompatIntoPodfile,
  MARKER,
  POST_INSTALL_SNIPPET,
} = require('../../plugins/withOpenIapXcodeCompat');

describe('withOpenIapXcodeCompat', () => {
  const samplePodfile = `target 'App' do
end

post_install do |installer|
  react_native_post_install(installer)
end
`;

  it('injects OpenIAP StoreKit compat into post_install', () => {
    const { contents, didMerge } = injectOpenIapCompatIntoPodfile(samplePodfile);
    expect(didMerge).toBe(true);
    expect(contents).toContain(MARKER);
    expect(contents).toContain("gsub('#if compiler(>=6.3)'");
    expect(contents).toContain("gsub('#if swift(>=6.3)'");
    // Swift rejects `#if false # comment` — must be `//` trailing comment.
    expect(contents).toContain(`'#if false // ${MARKER}'`);
    expect(contents).not.toContain(`'#if false # ${MARKER}'`);
    expect(contents).toContain('react_native_post_install(installer)');
    expect(POST_INSTALL_SNIPPET).toContain(MARKER);
  });

  it('is idempotent when marker already present', () => {
    const once = injectOpenIapCompatIntoPodfile(samplePodfile).contents;
    const twice = injectOpenIapCompatIntoPodfile(once).contents;
    expect(twice).toBe(once);
  });

  it('throws when Podfile has no post_install hook', () => {
    expect(() => injectOpenIapCompatIntoPodfile("target 'App' do\nend\n")).toThrow(
      /post_install/,
    );
  });
});
