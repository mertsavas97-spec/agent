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
    data: () => ({ examType: 'kpss' }),
  }),
}));

jest.mock('@/src/lib/api/progressClient', () => ({
  fetchAttempts: jest.fn().mockResolvedValue({
    items: [
      {
        attemptId: 'local-1',
        createdAt: new Date().toISOString(),
        subject: 'turkish',
        topicId: 'kpss-turkish-anlam',
        status: 'solved',
        thumbnailUrl: null,
        examType: 'kpss',
      },
    ],
    nextCursor: null,
  }),
}));

import HistoryScreen from '@/app/(tabs)/history';

describe('HistoryScreen', () => {
  it('lists attempts with readable topic name', async () => {
    render(<HistoryScreen />);
    expect(screen.getByTestId('history-screen')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('history-list')).toBeTruthy();
      expect(screen.getByTestId('history-item-local-1')).toBeTruthy();
    });
  });
});
