import React from 'react';
import { render, screen } from '@testing-library/react-native';

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
});
