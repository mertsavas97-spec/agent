import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SolutionScreen } from '@/src/features/solve/SolutionScreen';

describe('SolutionScreen', () => {
  it('renders numbered steps and transparency note', () => {
    render(
      <SolutionScreen
        steps={[
          { title: '1. Adım', body: 'Paydaları eşitle.' },
          { title: '2. Adım', body: 'Topla.' },
        ]}
        transparencyNote="AI tarafından üretilmiştir, kontrol etmeni öneririz."
      />,
    );

    expect(screen.getByTestId('solution-screen')).toBeTruthy();
    expect(screen.getByTestId('step-0')).toBeTruthy();
    expect(screen.getByText('Paydaları eşitle.')).toBeTruthy();
    expect(screen.getByTestId('transparency-note')).toHaveTextContent(/AI tarafından/);
  });

  it('shows follow-up text after explain again', async () => {
    const onExplainAgain = jest.fn().mockResolvedValue('Daha sade: payları topla.');
    render(
      <SolutionScreen
        steps={[{ title: '1', body: 'x' }]}
        solutionId="sol-1"
        onExplainAgain={onExplainAgain}
      />,
    );

    fireEvent.press(screen.getByTestId('explain-again-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('follow-up-text')).toHaveTextContent(
        /Daha sade: payları topla/,
      );
    });
    expect(onExplainAgain).toHaveBeenCalled();
  });
});
