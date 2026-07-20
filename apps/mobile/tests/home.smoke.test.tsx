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
  it('renders action-first home without tutorial walls of text', async () => {
    render(<HomeScreen />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByText('ÇözBil')).toBeTruthy();
    expect(screen.queryByText(/Kitaptaki veya defterdeki/i)).toBeNull();
    expect(screen.queryByText('AKTİF SINAV MODU')).toBeNull();
    expect(screen.queryByText(/Soru fotoğrafı gönder/i)).toBeNull();
    expect(screen.getByTestId('home-premium-cta')).toBeTruthy();
    expect(screen.getByTestId('capture-cta')).toHaveTextContent('Soru fotoğrafı çek');
    expect(screen.getByTestId('gallery-cta')).toHaveTextContent('Galeriden seç');
    expect(screen.getByTestId('multi-batch-cta')).toHaveTextContent(/Çoklu soru/);
    expect(screen.getByTestId('home-topics-link')).toHaveTextContent(/Konu anlatımı/);
    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    await waitFor(() => {
      expect(
        screen.getByTestId('exam-mode-ygs').props.accessibilityState?.selected,
      ).toBe(true);
      expect(screen.getByTestId('home-streak')).toHaveTextContent(/0 gün/);
      expect(screen.getByTestId('home-recent-empty')).toHaveTextContent(/Henüz çözüm yok/);
    });
  });
});
