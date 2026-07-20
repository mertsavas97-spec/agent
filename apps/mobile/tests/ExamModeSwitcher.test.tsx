import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';

describe('ExamModeSwitcher', () => {
  it('shows compact segmented exam selection without tutorial copy', () => {
    const onChange = jest.fn();
    render(<ExamModeSwitcher value="ygs" onChange={onChange} />);

    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    expect(screen.queryByText('AKTİF SINAV MODU')).toBeNull();
    expect(screen.queryByTestId('exam-mode-chip')).toBeNull();
    expect(screen.queryByTestId('exam-mode-active-line')).toBeNull();
    expect(screen.queryByTestId('exam-mode-legend')).toBeNull();
    expect(screen.queryByText(/modundasın/i)).toBeNull();

    expect(screen.getByTestId('exam-mode-lgs')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-ygs')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-kpss')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-trafik')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-ygs').props.accessibilityState?.selected).toBe(
      true,
    );

    fireEvent.press(screen.getByTestId('exam-mode-kpss'));
    expect(onChange).toHaveBeenCalledWith('kpss');

    fireEvent.press(screen.getByTestId('exam-mode-lgs'));
    expect(onChange).toHaveBeenCalledWith('lgs');

    fireEvent.press(screen.getByTestId('exam-mode-trafik'));
    expect(onChange).toHaveBeenCalledWith('trafik');
  });

  it('shows idle hint when no exam selected', () => {
    render(<ExamModeSwitcher value={null} onChange={jest.fn()} />);
    expect(screen.getByTestId('exam-mode-idle-hint')).toHaveTextContent('Sınavını seç');
  });

  it('hides idle hint when an exam is selected', () => {
    render(<ExamModeSwitcher value="kpss" onChange={jest.fn()} />);
    expect(screen.queryByTestId('exam-mode-idle-hint')).toBeNull();
  });
});
