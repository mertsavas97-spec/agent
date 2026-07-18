import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const ReactLib = require('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactLib.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock('@/src/lib/api/progressClient', () => ({
  fetchProgressSummary: jest.fn().mockResolvedValue({
    streakCount: 2,
    weakestTopic: {
      topicId: 'lgs-math-kesirler',
      nameTr: 'Kesirler',
      attemptCount: 3,
      followUpCount: 4,
    },
    topics: [
      {
        topicId: 'lgs-math-kesirler',
        nameTr: 'Kesirler',
        attemptCount: 3,
        followUpCount: 4,
      },
    ],
    weekly: [{ date: '2026-07-18', solvedCount: 1 }],
  }),
}));

import StatsScreen from '@/app/(tabs)/stats';

describe('StatsScreen', () => {
  it('shows weakest topic and streak', async () => {
    render(<StatsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('weakest-topic')).toHaveTextContent(/Kesirler/);
    });
    expect(screen.getByTestId('stats-streak')).toHaveTextContent('Seri: 2 gün');
  });
});
