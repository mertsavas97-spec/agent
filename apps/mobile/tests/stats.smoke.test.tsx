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

jest.mock('@/src/lib/api/progressClient', () => {
  const { buildProgressFromAttempts } = require('@/src/features/stats/buildProgressFromAttempts');
  return {
    fetchProgressAttempts: jest.fn().mockResolvedValue([
      {
        attemptId: 'a-kpss',
        createdAt: new Date().toISOString(),
        subject: 'turkish',
        topicId: 'kpss-turkish-anlam',
        status: 'solved',
        thumbnailUrl: null,
        examType: 'kpss',
      },
      {
        attemptId: 'a-ygs',
        createdAt: new Date().toISOString(),
        subject: 'math',
        topicId: 'ygs-math-001',
        status: 'solved',
        thumbnailUrl: null,
        examType: 'ygs',
      },
    ]),
    progressForExam: (items: unknown, exam: string) =>
      buildProgressFromAttempts(items, exam),
  };
});

import StatsScreen from '@/app/(tabs)/stats';

describe('StatsScreen', () => {
  it('locks to active exam and ignores other-exam attempts', async () => {
    render(<StatsScreen />);
    expect(screen.getByTestId('stats-screen')).toBeTruthy();
    expect(screen.queryByTestId('stats-exam-tabs')).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId('stats-mode-chip')).toHaveTextContent('MOD: KPSS');
      expect(screen.getByTestId('stats-streak')).toBeTruthy();
    });
    expect(screen.queryByTestId('stats-jump-ygs')).toBeNull();
  });
});
