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

jest.mock('@/src/features/solve/image', () => ({
  pickFromCamera: jest.fn(),
  pickFromLibrary: jest.fn(),
}));

jest.mock('@/src/lib/api/progressClient', () => ({
  fetchProgressSummary: jest.fn().mockResolvedValue({
    streakCount: 0,
    weakestTopic: null,
    topics: [],
    weekly: [],
  }),
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
    data: () => ({ examType: 'ygs' }),
  }),
}));

jest.mock('@/src/features/exam/updateExamClient', () => ({
  callUpdateExamType: jest.fn().mockResolvedValue('ygs'),
}));

import HomeScreen from '@/app/(tabs)/index';

describe('HomeScreen', () => {
  it('renders brand, exam switcher, and capture CTA', async () => {
    render(<HomeScreen />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByText('ÇözBil')).toBeTruthy();
    expect(screen.getByTestId('capture-cta')).toBeTruthy();
    expect(screen.getByTestId('gallery-cta')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    expect(screen.getByText(/Galeriden Seç/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('home-streak')).toHaveTextContent(/Seri: 0 gün/);
      expect(screen.getByTestId('exam-mode-ygs').props.accessibilityState?.selected).toBe(true);
    });
  });
});
