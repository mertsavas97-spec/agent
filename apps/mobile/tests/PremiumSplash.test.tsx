import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { PremiumSplash } from '@/src/ui/PremiumSplash';

describe('PremiumSplash', () => {
  it('renders brand wordmark on navy without placeholder chrome', () => {
    render(<PremiumSplash status="Oturum açılıyor" />);
    expect(screen.getByTestId('premium-splash')).toHaveStyle({
      backgroundColor: '#1E1B4B',
    });
    expect(screen.getByText('ÇözBil')).toBeTruthy();
    expect(screen.getByText('Adım adım sınav çözümü')).toBeTruthy();
    expect(screen.getByTestId('premium-splash-robot')).toBeTruthy();
    expect(screen.getByTestId('premium-splash-status')).toHaveTextContent(
      /Oturum açılıyor/,
    );
    expect(screen.queryByText(/demo|placeholder|hazırlık/i)).toBeNull();
  });
});
