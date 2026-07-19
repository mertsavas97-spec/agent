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

jest.mock('@/src/lib/api/progressClient', () => ({
  fetchProgressSummary: jest.fn().mockResolvedValue({
    streakCount: 2,
    weakestTopic: {
      topicId: 'kpss-turkish-anlam',
      nameTr: 'Anlam ilgisi',
      attemptCount: 1,
      followUpCount: 0,
    },
    topics: [
      {
        topicId: 'kpss-turkish-anlam',
        nameTr: 'Anlam ilgisi',
        attemptCount: 3,
        followUpCount: 0,
      },
    ],
    weekly: [
      { date: '2026-07-13', solvedCount: 0 },
      { date: '2026-07-14', solvedCount: 1 },
      { date: '2026-07-15', solvedCount: 0 },
      { date: '2026-07-16', solvedCount: 2 },
      { date: '2026-07-17', solvedCount: 0 },
      { date: '2026-07-18', solvedCount: 1 },
      { date: '2026-07-19', solvedCount: 1 },
    ],
    examType: 'kpss',
    totalSolved: 3,
    subjectMix: [{ subject: 'turkish', label: 'Türkçe', count: 3, pct: 100 }],
    focusHint: 'En az denenen konu — dengeni buradan kur.',
  }),
}));

import StatsScreen from '@/app/(tabs)/stats';

describe('StatsScreen', () => {
  it('renders streak hero, weekly bars, subject mix and focus card', async () => {
    render(<StatsScreen />);
    expect(screen.getByTestId('stats-screen')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('stats-streak')).toBeTruthy();
      expect(screen.getByTestId('weekly-series')).toBeTruthy();
      expect(screen.getByTestId('subject-mix')).toBeTruthy();
      expect(screen.getByTestId('weakest-topic')).toBeTruthy();
      expect(screen.getByTestId('topic-bar-kpss-turkish-anlam')).toBeTruthy();
    });
  });
});
