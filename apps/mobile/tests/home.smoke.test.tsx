import React from 'react';
import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';

describe('HomeScreen', () => {
  it('renders brand and capture CTA', () => {
    render(<HomeScreen />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
    expect(screen.getByText('ÇözBil')).toBeTruthy();
    expect(screen.getByTestId('capture-cta')).toBeTruthy();
    expect(screen.getByText('LGS · YGS · KPSS')).toBeTruthy();
  });
});
