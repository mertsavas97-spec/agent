/**
 * OpenIAP (via expo-iap) compiles StoreKit billing-plan APIs behind
 * `#if compiler(>=6.3)` / `#if swift(>=6.3)`.
 *
 * Xcode 26.4 ships Swift 6.3 but iPhoneOS26.4.sdk still lacks:
 *   Product.SubscriptionInfo.pricingTerms
 *   RenewalInfo.renewalBillingPlanType / commitmentInfo
 *   Transaction.billingPlanType / commitmentInfo
 * Those symbols land with the Xcode 26.5+ SDK (OpenIAP's own comments agree).
 *
 * ÇözBil uses standard weekly/monthly/yearly auto-renewables — not Apple's
 * "monthly with 12-month commitment" billing plans — so disabling those
 * compile paths is safe and unblocks local/GHA IPA on Xcode 26.4.
 *
 * Preferred long-term: build with Xcode 26.5+ (then this patch is a no-op
 * safety net until OpenIAP gates on SDK, not Swift language version).
 */
const {
  createRunOncePlugin,
  withPodfile,
} = require('@expo/config-plugins');
const {
  mergeContents,
} = require('@expo/config-plugins/build/utils/generateCode');

const TAG = 'cozbil-openiap-xcode-compat';
const MARKER = 'cozbil-openiap-xcode-compat';

/** Ruby injected into Podfile `post_install` (runs after openiap is downloaded). */
const POST_INSTALL_SNIPPET = `
  # ${MARKER}: neutralize OpenIAP StoreKit billing-plan guards (need Xcode 26.5+ SDK).
  openiap_pod = File.join(installer.sandbox.root, 'openiap')
  if Dir.exist?(openiap_pod)
    Dir.glob(File.join(openiap_pod, '**', '*.swift')).each do |swift_file|
      original = File.read(swift_file)
      # Swift: trailing comment after #if must use // — a bare "#" starts another directive.
      patched = original
        .gsub('#if compiler(>=6.3)', '#if false // ${MARKER}')
        .gsub('#if swift(>=6.3)', '#if false // ${MARKER}')
      if patched != original
        File.chmod(File.stat(swift_file).mode | 0o200, swift_file)
        File.write(swift_file, patched)
        Pod::UI.puts "[cozbil] OpenIAP Xcode 26.4 StoreKit compat: #{swift_file}"
      end
    end
  end
`;

/**
 * @param {string} src Podfile contents
 * @returns {{ contents: string, didMerge: boolean }}
 */
function injectOpenIapCompatIntoPodfile(src) {
  if (src.includes(MARKER)) {
    return { contents: src, didMerge: true };
  }
  const merged = mergeContents({
    tag: TAG,
    src,
    newSrc: POST_INSTALL_SNIPPET.trimEnd() + '\n',
    anchor: /post_install do \|installer\|/,
    offset: 1,
    comment: '#',
  });
  if (!merged.didMerge) {
    throw new Error(
      `[${MARKER}] Could not find \`post_install do |installer|\` in Podfile. ` +
        'Re-run \`npx expo prebuild\` or upgrade Xcode to 26.5+.',
    );
  }
  return { contents: merged.contents, didMerge: true };
}

function withOpenIapXcodeCompat(config) {
  return withPodfile(config, (cfg) => {
    const result = injectOpenIapCompatIntoPodfile(cfg.modResults.contents);
    cfg.modResults.contents = result.contents;
    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withOpenIapXcodeCompat,
  'withOpenIapXcodeCompat',
  '1.0.1',
);
module.exports.injectOpenIapCompatIntoPodfile = injectOpenIapCompatIntoPodfile;
module.exports.POST_INSTALL_SNIPPET = POST_INSTALL_SNIPPET;
module.exports.MARKER = MARKER;
