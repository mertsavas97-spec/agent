import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';

describe('ExamModeSwitcher', () => {
  it('renders LGS YGS KPSS and reports selection changes', () => {
    const onChange = jest.fn();
    render(<ExamModeSwitcher value="ygs" onChange={onChange} />);

    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-lgs')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-ygs')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-kpss')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-ygs').props.accessibilityState?.selected).toBe(true);

    fireEvent.press(screen.getByTestId('exam-mode-kpss'));
    expect(onChange).toHaveBeenCalledWith('kpss');

    fireEvent.press(screen.getByTestId('exam-mode-lgs'));
    expect(onChange).toHaveBeenCalledWith('lgs');
  });
});
