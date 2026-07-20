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

jest.mock('@/src/features/exam/resolveActiveExam', () => ({
  resolveActiveExamType: jest.fn().mockResolvedValue({
    examType: 'kpss',
    source: 'preference',
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
      {
        attemptId: 'local-ygs',
        createdAt: new Date().toISOString(),
        subject: 'math',
        topicId: 'ygs-math-001',
        status: 'solved',
        thumbnailUrl: null,
        examType: 'ygs',
      },
    ],
    nextCursor: null,
  }),
}));

import HistoryScreen from '@/app/(tabs)/history';

describe('HistoryScreen', () => {
  it('lists only active-exam attempts', async () => {
    render(<HistoryScreen />);
    expect(screen.getByTestId('history-screen')).toBeTruthy();
    expect(screen.queryByTestId('history-exam-filters')).toBeNull();
    await waitFor(() => {
      expect(screen.getByTestId('history-mode-chip')).toHaveTextContent('MOD: KPSS');
      expect(screen.getByTestId('history-list')).toBeTruthy();
      expect(screen.getByTestId('history-item-local-1')).toBeTruthy();
    });
    expect(screen.queryByTestId('history-item-local-ygs')).toBeNull();
  });
});
