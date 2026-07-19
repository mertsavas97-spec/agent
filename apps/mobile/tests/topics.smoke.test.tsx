import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import TopicsScreen from '@/app/(tabs)/topics';

describe('TopicsScreen', () => {
  it('themes by exam and switches Konular / Örnek sorular panels', async () => {
    render(<TopicsScreen />);
    expect(screen.getByTestId('topics-screen')).toBeTruthy();
    expect(screen.getByTestId('topics-mode-chip')).toHaveTextContent('MOD: LGS');
    expect(screen.getByTestId('topics-exam-tabs')).toBeTruthy();
    expect(screen.getByTestId('topics-panel-tabs')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('topics-list')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('topics-panel-samples'));
    await waitFor(() => {
      expect(screen.getByTestId('topics-samples-list')).toBeTruthy();
      expect(screen.getByTestId('topic-item-lgs-turkish-paragraf-001')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('topics-exam-kpss'));
    await waitFor(() => {
      expect(screen.getByTestId('topics-mode-chip')).toHaveTextContent('MOD: KPSS');
    });
  });
});
