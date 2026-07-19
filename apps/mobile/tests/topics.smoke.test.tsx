import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn() }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock('@/src/lib/auth', () => ({
  ensureSignedIn: jest.fn().mockResolvedValue({ uid: 'u1' }),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({ db: {} }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    data: () => ({ examType: 'lgs' }),
  }),
}));

import TopicsScreen from '@/app/(tabs)/topics';

describe('TopicsScreen', () => {
  it('lists exam tabs, topics and örnek soru cards', async () => {
    render(<TopicsScreen />);
    expect(screen.getByTestId('topics-screen')).toBeTruthy();
    expect(screen.getByText('Konu anlatımı')).toBeTruthy();
    expect(screen.getByTestId('topics-exam-tabs')).toBeTruthy();
    expect(screen.queryByTestId('topics-photo-cta')).toBeNull();
    await waitFor(() => {
      expect(screen.getByTestId('topics-list')).toBeTruthy();
      // LGS default ders = Türkçe
      expect(screen.getByTestId('topic-item-lgs-turkish-paragraf-001')).toBeTruthy();
    });
  });
});
