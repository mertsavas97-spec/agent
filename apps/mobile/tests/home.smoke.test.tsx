import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/src/features/solve/image', () => ({
  pickFromCamera: jest.fn(),
  pickFromLibrary: jest.fn(),
}));

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
