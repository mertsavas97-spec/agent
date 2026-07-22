import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock('expo-symbols', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SymbolView: (props: { testID?: string }) =>
      React.createElement(View, { testID: props.testID ?? 'symbol-view' }),
  };
});

jest.mock('@/src/features/solve/image', () => ({
  pickFromCamera: jest.fn(),
  pickFromLibrary: jest.fn(),
}));

jest.mock('@/src/lib/api/progressClient', () => ({
  fetchAttempts: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
}));

jest.mock('@/src/lib/auth', () => ({
  ensureSignedIn: jest.fn().mockResolvedValue({ uid: 'test-user' }),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({ db: {} }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ examType: 'ygs', streakCount: 3 }),
  }),
}));

jest.mock('@/src/features/ads', () => ({
  BannerSlot: () => null,
  isPremiumAudience: () => false,
  runRewardedMultiBatchUnlock: jest.fn(),
}));

jest.mock('@/src/features/paywall/entitlement', () => ({
  hydrateEntitlement: jest.fn().mockResolvedValue(null),
  isPremiumActive: () => false,
}));

jest.mock('@/src/features/exam/examPreferenceCache', () => ({
  loadExamPreferenceCached: jest.fn().mockResolvedValue('ygs'),
  peekExamPreferenceCache: jest.fn().mockReturnValue('ygs'),
}));

jest.mock('@/src/features/exam/useExamModeChange', () => ({
  useExamModeChange: () => ({
    switching: false,
    requestExamChange: jest.fn(),
    applyExam: jest.fn(),
  }),
  loadEntitlementSnapshot: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/src/features/exam/updateExamClient', () => ({
  callUpdateExamType: jest.fn().mockResolvedValue('ygs'),
}));

jest.mock('@/src/features/exam/examPreference', () => ({
  readExamPreference: jest.fn().mockResolvedValue('ygs'),
}));

jest.mock('@/src/features/stats/localStreakStore', () => {
  const actual = jest.requireActual('@/src/features/stats/localStreakStore');
  return {
    ...actual,
    loadLocalStreakState: jest.fn().mockResolvedValue({
      streakCount: 0,
      streakLastActiveDate: null,
      activeDates: [],
    }),
  };
});

import HomeScreen from '@/app/(tabs)/index';

describe('HomeScreen', () => {
  it('shows brand, greeting, streak week, hero CTA, and more section', async () => {
    render(<HomeScreen />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByTestId('home-brand-robot')).toBeTruthy();
    expect(screen.getByText('ÇözBil')).toBeTruthy();
    expect(screen.getByTestId('home-greeting')).toHaveTextContent('Merhaba');
    expect(screen.getByTestId('home-streak-week')).toBeTruthy();
    expect(screen.getByTestId('home-streak-hint')).toBeTruthy();
    expect(screen.getByTestId('home-hero')).toBeTruthy();
    expect(screen.getByTestId('home-premium-cta')).toBeTruthy();
    expect(screen.getByTestId('capture-cta')).toHaveTextContent('Soru fotoğrafı çek');
    expect(screen.getByTestId('home-more')).toBeTruthy();
    expect(screen.getByTestId('multi-batch-cta')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
      expect(screen.getByTestId('exam-mode-title')).toHaveTextContent(/Sınav paketini seç/i);
      expect(screen.getByTestId('home-streak')).toHaveTextContent('3 gün');
    });
  });
});
