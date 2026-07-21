import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Safe haptics — no-ops on web / when unavailable. */
export async function hapticSelection(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch {
    /* ignore */
  }
}

export async function hapticLight(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* ignore */
  }
}

export async function hapticMedium(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* ignore */
  }
}

export async function hapticSuccess(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* ignore */
  }
}
