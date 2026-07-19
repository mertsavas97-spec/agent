import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

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
    ]),
    progressForExam: (items: unknown, exam: string) =>
      buildProgressFromAttempts(items, exam),
  };
});

import StatsScreen from '@/app/(tabs)/stats';

describe('StatsScreen', () => {
  it('defaults to exam with data and keeps empty wording on other tabs', async () => {
    render(<StatsScreen />);
    expect(screen.getByTestId('stats-screen')).toBeTruthy();
    expect(screen.getByTestId('stats-exam-tabs')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('stats-mode-chip')).toHaveTextContent('MOD: KPSS');
      expect(screen.getByTestId('stats-streak')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('stats-exam-ygs'));
    await waitFor(() => {
      expect(screen.getByTestId('stats-empty')).toBeTruthy();
      expect(screen.getByText(/YGS için henüz iz yok/i)).toBeTruthy();
      expect(screen.getByTestId('stats-jump-kpss')).toBeTruthy();
    });
  });
});
