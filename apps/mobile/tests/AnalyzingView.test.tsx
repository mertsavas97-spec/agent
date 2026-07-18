import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { AnalyzingView } from '@/src/features/solve/AnalyzingView';

describe('AnalyzingView', () => {
  it('shows analyzing copy', () => {
    render(<AnalyzingView />);
    expect(screen.getByTestId('analyzing-view')).toBeTruthy();
    expect(screen.getByText(/Sorun analiz ediliyor/)).toBeTruthy();
  });
});
