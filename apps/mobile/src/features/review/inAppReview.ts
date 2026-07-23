/**
 * Gentle in-app review prompt — Android-first (Play In-App Review via Expo).
 * No shaming / overclaim copy; only system sheet when available.
 *
 * Dynamic require: old native builds without ExpoStoreReview must not crash
 * when Metro serves newer JS (dev-client without rebuild).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { AnalyticsEvents, track } from '@/src/lib/analytics';

const PROMPTED_KEY = '@cozbil/store_review_prompted_v1';
const SOLVE_COUNT_KEY = '@cozbil/store_review_solve_count_v1';

/** Prompt after this many successful solves on device (lifetime). */
export const REVIEW_AFTER_SOLVES = 3;

type StoreReviewModule = {
  isAvailableAsync: () => Promise<boolean>;
  requestReview: () => Promise<void>;
};

function loadStoreReview(): StoreReviewModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-store-review') as StoreReviewModule;
  } catch {
    return null;
  }
}

export async function recordSuccessfulSolveForReview(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SOLVE_COUNT_KEY);
    const next = (raw ? Number(raw) : 0) + 1;
    await AsyncStorage.setItem(SOLVE_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

export async function maybeRequestInAppReview(): Promise<
  'prompted' | 'skipped_unavailable' | 'skipped_early' | 'skipped_already'
> {
  try {
    const StoreReview = loadStoreReview();
    if (!StoreReview) return 'skipped_unavailable';

    const available = await StoreReview.isAvailableAsync();
    if (!available) return 'skipped_unavailable';

    const prompted = await AsyncStorage.getItem(PROMPTED_KEY);
    if (prompted === '1') return 'skipped_already';

    const raw = await AsyncStorage.getItem(SOLVE_COUNT_KEY);
    const count = raw ? Number(raw) : 0;
    if (count < REVIEW_AFTER_SOLVES) return 'skipped_early';

    await StoreReview.requestReview();
    await AsyncStorage.setItem(PROMPTED_KEY, '1');
    track(AnalyticsEvents.reviewPrompted, { afterSolves: count });
    return 'prompted';
  } catch {
    return 'skipped_unavailable';
  }
}

/** Call once when a solved result is shown. */
export async function onSolveSuccessMaybeReview(): Promise<void> {
  await recordSuccessfulSolveForReview();
  await maybeRequestInAppReview();
}

export async function __resetInAppReviewForTests(): Promise<void> {
  await AsyncStorage.multiRemove([PROMPTED_KEY, SOLVE_COUNT_KEY]);
}
