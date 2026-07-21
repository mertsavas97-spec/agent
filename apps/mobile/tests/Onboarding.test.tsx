import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

import { OnboardingFlow } from '@/src/features/onboarding/OnboardingFlow';

describe('OnboardingFlow', () => {
  function goToExamStep() {
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
  }

  it('walks 3 screens and allows selecting LGS, YGS, and KPSS', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);

    expect(screen.getByTestId('onboarding-step-0')).toBeTruthy();
    expect(screen.getByTestId('onboarding-progress')).toBeTruthy();
    expect(screen.getByTestId('onboarding-hero')).toBeTruthy();
    goToExamStep();

    expect(screen.getByTestId('onboarding-step-2')).toBeTruthy();
    expect(screen.getByTestId('exam-lgs')).toBeTruthy();
    expect(screen.getByTestId('exam-ygs')).toBeTruthy();
    expect(screen.getByTestId('exam-kpss')).toBeTruthy();

    expect(screen.getByTestId('exam-lgs').props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.getByTestId('exam-ygs').props.accessibilityState?.disabled).not.toBe(true);
    expect(screen.getByTestId('exam-kpss').props.accessibilityState?.disabled).not.toBe(true);

    fireEvent.press(screen.getByTestId('exam-ygs'));
    fireEvent.press(screen.getByTestId('age-18plus'));
    fireEvent.press(screen.getByTestId('consent-toggle'));
    fireEvent.press(screen.getByTestId('onboarding-finish'));

    expect(onComplete).toHaveBeenCalledWith({
      examType: 'ygs',
      ageBand: '18plus',
      parentalConsent: false,
    });
  });

  it('requires age band + parental consent for minors even on non-LGS', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);

    goToExamStep();
    fireEvent.press(screen.getByTestId('exam-kpss'));
    fireEvent.press(screen.getByTestId('age-13to17'));
    fireEvent.press(screen.getByTestId('consent-toggle'));
    fireEvent.press(screen.getByTestId('onboarding-finish'));

    expect(onComplete).toHaveBeenCalledWith({
      examType: 'kpss',
      ageBand: '13to17',
      parentalConsent: true,
    });
  });

  it('selects LGS with adult age band without parental flag', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);

    goToExamStep();
    fireEvent.press(screen.getByTestId('exam-lgs'));
    fireEvent.press(screen.getByTestId('age-18plus'));
    fireEvent.press(screen.getByTestId('consent-toggle'));
    fireEvent.press(screen.getByTestId('onboarding-finish'));

    expect(onComplete).toHaveBeenCalledWith({
      examType: 'lgs',
      ageBand: '18plus',
      parentalConsent: false,
    });
  });

  it('selects KPSS', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);
    goToExamStep();
    fireEvent.press(screen.getByTestId('exam-kpss'));
    fireEvent.press(screen.getByTestId('age-18plus'));
    fireEvent.press(screen.getByTestId('consent-toggle'));
    fireEvent.press(screen.getByTestId('onboarding-finish'));
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ examType: 'kpss', ageBand: '18plus' }),
    );
  });

  it('shows exam mode chip when an exam is selected', () => {
    render(<OnboardingFlow onComplete={jest.fn()} />);
    goToExamStep();
    fireEvent.press(screen.getByTestId('exam-trafik'));
    expect(screen.getByText('MOD: EHLİYET')).toBeTruthy();
  });

  it('does not finish without age band', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow onComplete={onComplete} />);
    goToExamStep();
    fireEvent.press(screen.getByTestId('exam-ygs'));
    expect(screen.queryByTestId('consent-toggle')).toBeNull();
    fireEvent.press(screen.getByTestId('onboarding-finish'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('keeps age band when switching exam', () => {
    render(<OnboardingFlow onComplete={jest.fn()} />);
    goToExamStep();
    fireEvent.press(screen.getByTestId('exam-lgs'));
    fireEvent.press(screen.getByTestId('age-13to17'));
    fireEvent.press(screen.getByTestId('exam-kpss'));
    expect(screen.getByTestId('age-13to17').props.accessibilityState?.selected).toBe(
      true,
    );
    expect(screen.getByTestId('consent-toggle')).toBeTruthy();
    expect(screen.getByTestId('consent-toggle').props.accessibilityRole).toBe(
      'checkbox',
    );
  });

  it('shows distinct under-13 consent copy', () => {
    render(<OnboardingFlow onComplete={jest.fn()} />);
    goToExamStep();
    fireEvent.press(screen.getByTestId('exam-lgs'));
    fireEvent.press(screen.getByTestId('age-under13'));
    expect(screen.getByTestId('consent-toggle')).toHaveTextContent(/veli onayı zorunlu/i);
  });
});
