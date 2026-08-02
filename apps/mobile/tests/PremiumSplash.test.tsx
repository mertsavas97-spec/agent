import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { PremiumSplash } from '@/src/ui/PremiumSplash';

describe('PremiumSplash', () => {
  it('renders brand wordmark hero, exam strip, and status (not icon-only)', () => {
    render(<PremiumSplash status="Oturum açılıyor" />);
    expect(screen.getByTestId('premium-splash')).toHaveStyle({
      backgroundColor: '#0F0C30',
    });
    expect(screen.getByText('ÇözBil')).toBeTruthy();
    expect(
      screen.getByText('Fotoğraftan adım adım sınav çözümü'),
    ).toBeTruthy();
    expect(screen.getByTestId('premium-splash-robot')).toBeTruthy();
    expect(screen.getByTestId('premium-splash-exams')).toBeTruthy();
    expect(screen.getByText('LGS')).toBeTruthy();
    expect(screen.getByText('YKS')).toBeTruthy();
    expect(screen.getByText('KPSS')).toBeTruthy();
    expect(screen.getByText('Ehliyet')).toBeTruthy();
    expect(screen.getByTestId('premium-splash-status')).toHaveTextContent(
      /Oturum açılıyor/,
    );
    expect(screen.queryByText(/demo|placeholder/i)).toBeNull();
  });
});
