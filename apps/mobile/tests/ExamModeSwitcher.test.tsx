import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';

describe('ExamModeSwitcher', () => {
  it('shows mod picker label and bold segmented selection', () => {
    const onChange = jest.fn();
    render(<ExamModeSwitcher value="ygs" onChange={onChange} />);

    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    expect(screen.getByText('MOD SEÇİCİ')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-title')).toHaveTextContent(/Sınav paketini seç/);
    expect(screen.queryByTestId('exam-mode-chip')).toBeNull();
    expect(screen.queryByTestId('exam-mode-active-line')).toBeNull();
    expect(screen.queryByTestId('exam-mode-legend')).toBeNull();

    expect(screen.getByTestId('exam-mode-ygs').props.accessibilityState?.selected).toBe(
      true,
    );

    fireEvent.press(screen.getByTestId('exam-mode-kpss'));
    expect(onChange).toHaveBeenCalledWith('kpss');
  });

  it('shows idle hint when no exam selected', () => {
    render(<ExamModeSwitcher value={null} onChange={jest.fn()} />);
    expect(screen.getByTestId('exam-mode-idle-hint')).toHaveTextContent('Sınavını seç');
  });
});
