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
    data: () => ({ examType: 'ygs' }),
  }),
}));

jest.mock('@/src/features/exam/updateExamClient', () => ({
  callUpdateExamType: jest.fn().mockResolvedValue('ygs'),
}));

import HomeScreen from '@/app/(tabs)/index';

describe('HomeScreen', () => {
  it('renders robot brand, mod picker, premium icon, and capture CTAs', async () => {
    render(<HomeScreen />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByTestId('home-brand-robot')).toBeTruthy();
    expect(screen.getByText('ÇözBil')).toBeTruthy();
    expect(screen.queryByTestId('home-streak')).toBeNull();
    expect(screen.getByText('MOD SEÇİCİ')).toBeTruthy();
    expect(screen.getByTestId('home-premium-cta')).toBeTruthy();
    expect(screen.getByTestId('capture-cta')).toHaveTextContent('Soru fotoğrafı çek');
    expect(screen.getByTestId('gallery-cta')).toHaveTextContent('Galeriden seç');
    expect(screen.getByTestId('multi-batch-cta')).toHaveTextContent(/Çoklu soru/);
    await waitFor(() => {
      expect(
        screen.getByTestId('exam-mode-ygs').props.accessibilityState?.selected,
      ).toBe(true);
    });
  });
});
