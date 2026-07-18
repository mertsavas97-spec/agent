import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { OnboardingFlow } from '@/src/features/onboarding/OnboardingFlow';

describe('OnboardingFlow', () => {
  it('walks 3 screens and allows selecting LGS, YGS, and KPSS', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);

    expect(screen.getByTestId('onboarding-step-0')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-next'));

    expect(screen.getByTestId('onboarding-step-1')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-next'));

    expect(screen.getByTestId('onboarding-step-2')).toBeTruthy();
    expect(screen.getByTestId('exam-lgs')).toBeTruthy();
    expect(screen.getByTestId('exam-ygs')).toBeTruthy();
    expect(screen.getByTestId('exam-kpss')).toBeTruthy();

    // None disabled
    expect(screen.getByTestId('exam-lgs').props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.getByTestId('exam-ygs').props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.getByTestId('exam-kpss').props.accessibilityState?.disabled).not.toBe(true);

    fireEvent.press(screen.getByTestId('exam-ygs'));
    fireEvent.press(screen.getByTestId('consent-toggle'));
    fireEvent.press(screen.getByTestId('onboarding-finish'));

    expect(onComplete).toHaveBeenCalledWith({
      examType: 'ygs',
      ageBand: '18plus',
      parentalConsent: false,
    });
  });

  it('selects LGS with parental consent path', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);

    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('exam-lgs'));
    fireEvent.press(screen.getByTestId('consent-toggle'));
    fireEvent.press(screen.getByTestId('onboarding-finish'));

    expect(onComplete).toHaveBeenCalledWith({
      examType: 'lgs',
      ageBand: '13to17',
      parentalConsent: true,
    });
  });

  it('selects KPSS', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('exam-kpss'));
    fireEvent.press(screen.getByTestId('consent-toggle'));
    fireEvent.press(screen.getByTestId('onboarding-finish'));
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ examType: 'kpss' }),
    );
  });
});
