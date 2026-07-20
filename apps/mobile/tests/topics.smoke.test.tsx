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

jest.mock('@/src/features/exam/resolveActiveExam', () => ({
  resolveActiveExamType: jest.fn().mockResolvedValue({
    examType: 'lgs',
    source: 'default',
  }),
}));

import TopicsScreen from '@/app/(tabs)/topics';

describe('TopicsScreen', () => {
  it('locks to active exam and switches Konular / Örnek sorular panels', async () => {
    render(<TopicsScreen />);
    expect(screen.getByTestId('topics-screen')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('topics-mode-chip')).toHaveTextContent('MOD: LGS');
    });
    expect(screen.queryByTestId('topics-exam-tabs')).toBeNull();
    expect(screen.getByTestId('topics-panel-tabs')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('topics-list')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('topics-panel-samples'));
    await waitFor(() => {
      expect(screen.getByTestId('topics-samples-list')).toBeTruthy();
      expect(screen.getByTestId('topic-item-lgs-turkish-paragraf-001')).toBeTruthy();
    });
  });
});
