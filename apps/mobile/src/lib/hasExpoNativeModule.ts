/**
 * Probe Expo native modules without throwing (old dev-clients may lack newer natives).
 */

export function hasExpoNativeModule(moduleName: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: (name: string) => unknown;
    };
    return requireOptionalNativeModule(moduleName) != null;
  } catch {
    return false;
  }
}
