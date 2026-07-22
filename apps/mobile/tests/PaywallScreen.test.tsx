import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-symbols', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SymbolView: (props: { testID?: string }) =>
      React.createElement(View, { testID: props.testID ?? 'symbol-view' }),
  };
});

import { PaywallScreen } from '@/src/features/paywall/PaywallScreen';

describe('PaywallScreen', () => {
  it('shows Premium brand, three plans (week/monthly/yearly), and Hemen Başla', () => {
    const onStart = jest.fn();
    const onDismiss = jest.fn();
    render(<PaywallScreen onStart={onStart} onDismiss={onDismiss} />);

    expect(screen.getByTestId('paywall-screen')).toBeTruthy();
    expect(screen.getByTestId('paywall-brand')).toHaveTextContent(/ÇözBil/);
    expect(screen.getByTestId('paywall-headline')).toBeTruthy();
    expect(screen.getByTestId('paywall-plan-week')).toBeTruthy();
    expect(screen.getByTestId('paywall-plan-monthly')).toBeTruthy();
    expect(screen.getByTestId('paywall-plan-yearly')).toBeTruthy();
    expect(screen.getByTestId('paywall-price')).toHaveTextContent(/320\s*TL/);
    expect(screen.getByTestId('paywall-badge-yearly')).toHaveTextContent(/En avantajlı/);
    expect(screen.getByTestId('paywall-cta')).toHaveTextContent(/Yıllıkla Başla|Hemen Başla/);

    fireEvent.press(screen.getByTestId('paywall-cta'));
    expect(onStart).toHaveBeenCalledWith('yearly');
  });

  it('selects monthly 39 TL and weekly intro offer', () => {
    const onStart = jest.fn();
    render(<PaywallScreen onStart={onStart} onDismiss={jest.fn()} />);

    fireEvent.press(screen.getByTestId('paywall-plan-monthly'));
    expect(screen.getByTestId('paywall-price')).toHaveTextContent(/39\s*TL/);
    fireEvent.press(screen.getByTestId('paywall-cta'));
    expect(onStart).toHaveBeenCalledWith('monthly');

    fireEvent.press(screen.getByTestId('paywall-plan-week'));
    expect(screen.getByTestId('paywall-price')).toHaveTextContent(/14,90\s*TL/);
    fireEvent.press(screen.getByTestId('paywall-cta'));
    expect(onStart).toHaveBeenLastCalledWith('week');
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

  it('does not claim a free trial; weekly is paid intro', () => {
    render(<PaywallScreen onStart={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.queryByText(/7.?gün ücretsiz/i)).toBeNull();
    expect(screen.getByText(/ücretsiz deneme değildir/i)).toBeTruthy();
  });

  it('exposes optional rewarded CTA without replacing Premium', () => {
    const onWatchRewarded = jest.fn();
    render(
      <PaywallScreen
        onStart={jest.fn()}
        onDismiss={jest.fn()}
        onWatchRewarded={onWatchRewarded}
      />,
    );
    expect(screen.getByTestId('paywall-rewarded')).toHaveTextContent(/Reklam izle/);
    fireEvent.press(screen.getByTestId('paywall-rewarded'));
    expect(onWatchRewarded).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('paywall-cta')).toBeTruthy();
  });
});
