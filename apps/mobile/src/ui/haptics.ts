import { Platform } from 'react-native';

import { hasExpoNativeModule } from '@/src/lib/hasExpoNativeModule';

type HapticsModule = {
  selectionAsync: () => Promise<void>;
  impactAsync: (style: unknown) => Promise<void>;
  notificationAsync: (type: unknown) => Promise<void>;
  ImpactFeedbackStyle: { Light: unknown; Medium: unknown };
  NotificationFeedbackType: { Success: unknown };
};

function loadHaptics(): HapticsModule | null {
  if (Platform.OS === 'web') return null;
  if (!hasExpoNativeModule('ExpoHaptics')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-haptics') as HapticsModule;
  } catch {
    return null;
  }
}

/** Safe haptics — no-ops on web / when native module missing. */
export async function hapticSelection(): Promise<void> {
  const Haptics = loadHaptics();
  if (!Haptics) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    /* ignore */
  }
}

export async function hapticLight(): Promise<void> {
  const Haptics = loadHaptics();
  if (!Haptics) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* ignore */
  }
}

export async function hapticMedium(): Promise<void> {
  const Haptics = loadHaptics();
  if (!Haptics) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* ignore */
  }
}

export async function hapticSuccess(): Promise<void> {
  const Haptics = loadHaptics();
  if (!Haptics) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* ignore */
  }
}
