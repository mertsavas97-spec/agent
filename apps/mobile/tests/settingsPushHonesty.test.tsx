import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/src/features/push/pushPrefs', () => ({
  PUSH_CATEGORIES: [],
  loadPushPrefs: jest.fn().mockResolvedValue({
    master: false,
    streak: false,
    dailyReminder: false,
    weakTopic: false,
    quotaReset: false,
    premiumOffer: false,
    productUpdate: false,
  }),
  setPushCategory: jest.fn(),
}));

jest.mock('@/src/features/paywall/entitlement', () => ({
  hydrateEntitlement: jest.fn().mockResolvedValue(null),
  isPremiumActive: () => false,
}));

jest.mock('@/src/lib/auth', () => ({
  ensureSignedIn: jest.fn().mockResolvedValue({ uid: 'u1' }),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({ db: {} }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ data: () => ({ examType: 'lgs' }) }),
}));

jest.mock('@/src/features/exam/examPreference', () => ({
  readExamPreference: jest.fn().mockResolvedValue('lgs'),
}));

jest.mock('@/src/features/exam/updateExamClient', () => ({
  callUpdateExamType: jest.fn().mockResolvedValue('lgs'),
}));

jest.mock('@/src/features/ads', () => ({
  runRewardedExamSwitch: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/src/features/onboarding/completeClient', () => ({
  replayOnboardingForDemo: jest.fn(),
}));

jest.mock('@/src/ui/CozbilRobot', () => ({
  CozbilRobot: () => null,
}));

jest.mock('@/src/ui/haptics', () => ({
  hapticLight: jest.fn(),
  hapticSelection: jest.fn(),
}));

import SettingsScreen from '@/app/settings/index';

describe('Settings push honesty', () => {
  it('states that push delivery is not wired', async () => {
    render(<SettingsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('settings-push-honesty')).toBeTruthy();
    });
    expect(screen.getByText(/Gönderim henüz yok/i)).toBeTruthy();
    expect(screen.getByText(/bildirim gelmez/i)).toBeTruthy();
  });
});
