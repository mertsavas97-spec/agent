import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExamModeBlockScreen } from '@/src/features/solve/ExamModeBlockScreen';

jest.mock('expo-symbols', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SymbolView: (props: { testID?: string }) =>
      React.createElement(View, { testID: props.testID ?? 'symbol-view' }),
  };
});

describe('ExamModeBlockScreen', () => {
  it('shows premium block without solution actions', () => {
    const onSwitch = jest.fn();
    const onBack = jest.fn();
    render(
      <ExamModeBlockScreen
        activeExam="kpss"
        detectedExam="trafik"
        onSwitchMode={onSwitch}
        onGoBack={onBack}
      />,
    );
    expect(screen.getByTestId('exam-mode-block-screen')).toBeTruthy();
    expect(screen.getByTestId('exam-block-headline')).toHaveTextContent(/Ehliyet/i);
    expect(screen.getByTestId('exam-block-body')).toHaveTextContent(/KPSS modundasın/i);
    fireEvent.press(screen.getByTestId('exam-block-switch'));
    expect(onSwitch).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('exam-block-back'));
    expect(onBack).toHaveBeenCalled();
  });
});
