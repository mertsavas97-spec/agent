import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PaywallScreen } from '@/src/features/paywall/PaywallScreen';

describe('PaywallScreen', () => {
  it('shows Premium brand signal, 49 TL plan, and Hemen Başla CTA', () => {
    const onStart = jest.fn();
    const onDismiss = jest.fn();
    render(<PaywallScreen onStart={onStart} onDismiss={onDismiss} />);

    expect(screen.getByTestId('paywall-screen')).toBeTruthy();
    expect(screen.getByTestId('paywall-brand')).toHaveTextContent(/ÇözBil/);
    expect(screen.getByTestId('paywall-headline')).toBeTruthy();
    expect(screen.getByTestId('paywall-price')).toHaveTextContent(/49\s*TL/);
    expect(screen.getByTestId('paywall-cta')).toHaveTextContent(/Hemen Başla/);

    fireEvent.press(screen.getByTestId('paywall-cta'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('lists premium benefits and allows dismiss without trapping', () => {
    const onDismiss = jest.fn();
    render(<PaywallScreen onStart={jest.fn()} onDismiss={onDismiss} />);

    expect(screen.getByTestId('paywall-benefit-unlimited')).toBeTruthy();
    expect(screen.getByTestId('paywall-benefit-ads')).toBeTruthy();
    expect(screen.getByTestId('paywall-benefit-analysis')).toBeTruthy();

    fireEvent.press(screen.getByTestId('paywall-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
