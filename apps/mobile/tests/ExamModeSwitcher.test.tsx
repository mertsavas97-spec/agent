import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';

describe('ExamModeSwitcher', () => {
  it('labels exam mode and reports LGS/YGS/KPSS selection', () => {
    const onChange = jest.fn();
    render(<ExamModeSwitcher value="ygs" onChange={onChange} />);

    expect(screen.getByText('Sınavın')).toBeTruthy();
    expect(screen.getByText(/çözüm dili ve konular/i)).toBeTruthy();
    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-lgs')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-ygs')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-kpss')).toBeTruthy();
    expect(screen.getByText('Lise giriş')).toBeTruthy();
    expect(screen.getByText('Üniversite')).toBeTruthy();
    expect(screen.getByText('Kamu')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-ygs').props.accessibilityState?.selected).toBe(true);

    fireEvent.press(screen.getByTestId('exam-mode-kpss'));
    expect(onChange).toHaveBeenCalledWith('kpss');

    fireEvent.press(screen.getByTestId('exam-mode-lgs'));
    expect(onChange).toHaveBeenCalledWith('lgs');
  });
});
