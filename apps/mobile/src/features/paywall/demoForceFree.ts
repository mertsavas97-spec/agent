/**
 * Demo-only Premium ↔ Free override for personal dogfood builds.
 * Never ships as a production control — gated by __DEV__ / premium sandbox env.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@cozbil/demo_force_free_v1';

let memory = false;
let hydrated = false;

/** Same gate as local Premium activate — never in production release. */
export function isDemoPlanToolsAllowed(): boolean {
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') return true;
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

export function isDemoForceFree(): boolean {
  return isDemoPlanToolsAllowed() && memory;
}

export async function hydrateDemoForceFree(): Promise<boolean> {
  if (!isDemoPlanToolsAllowed()) {
    memory = false;
    hydrated = true;
    return false;
  }
  try {
    const raw = await AsyncStorage.getItem(KEY);
    memory = raw === '1';
  } catch {
    memory = false;
  }
  hydrated = true;
  return memory;
}

export function isDemoForceFreeHydrated(): boolean {
  return hydrated;
}

/**
 * Force free plan UX without wiping stored Premium entitlement.
 * Toggle off → previous local/sandbox Premium returns if still cached.
 */
export async function setDemoForceFree(enabled: boolean): Promise<boolean> {
  if (!isDemoPlanToolsAllowed()) {
    memory = false;
    return false;
  }
  memory = enabled;
  hydrated = true;
  if (enabled) {
    await AsyncStorage.setItem(KEY, '1');
  } else {
    await AsyncStorage.removeItem(KEY);
  }
  return memory;
}

/** Test helper — reset module memory between Jest cases. */
export function __resetDemoForceFreeForTests(): void {
  memory = false;
  hydrated = false;
}
