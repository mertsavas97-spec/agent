import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  REVIEW_AFTER_SOLVES,
  __resetInAppReviewForTests,
  maybeRequestInAppReview,
  recordSuccessfulSolveForReview,
} from '@/src/features/review/inAppReview';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/src/lib/hasExpoNativeModule', () => ({
  hasExpoNativeModule: jest.fn(() => true),
}));

const mockRequestReview = jest.fn(async () => undefined);
const mockIsAvailableAsync = jest.fn(async () => true);

jest.mock('expo-store-review', () => ({
  isAvailableAsync: () => mockIsAvailableAsync(),
  requestReview: () => mockRequestReview(),
}));

describe('inAppReview', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await __resetInAppReviewForTests();
    mockRequestReview.mockClear();
    mockIsAvailableAsync.mockResolvedValue(true);
  });

  it('skips until REVIEW_AFTER_SOLVES successful solves', async () => {
    for (let i = 0; i < REVIEW_AFTER_SOLVES - 1; i += 1) {
      await recordSuccessfulSolveForReview();
    }
    await expect(maybeRequestInAppReview()).resolves.toBe('skipped_early');
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('prompts once after threshold', async () => {
    for (let i = 0; i < REVIEW_AFTER_SOLVES; i += 1) {
      await recordSuccessfulSolveForReview();
    }
    await expect(maybeRequestInAppReview()).resolves.toBe('prompted');
    await expect(maybeRequestInAppReview()).resolves.toBe('skipped_already');
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('skips when native ExpoStoreReview module is missing', async () => {
    const { hasExpoNativeModule } = require('@/src/lib/hasExpoNativeModule') as {
      hasExpoNativeModule: jest.Mock;
    };
    hasExpoNativeModule.mockReturnValue(false);
    for (let i = 0; i < REVIEW_AFTER_SOLVES; i += 1) {
      await recordSuccessfulSolveForReview();
    }
    await expect(maybeRequestInAppReview()).resolves.toBe('skipped_unavailable');
    expect(mockRequestReview).not.toHaveBeenCalled();
    hasExpoNativeModule.mockReturnValue(true);
  });
});
