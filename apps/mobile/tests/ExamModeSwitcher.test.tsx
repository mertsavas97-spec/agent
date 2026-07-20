import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';

describe('ExamModeSwitcher', () => {
  it('shows MOD chip and per-exam selection', () => {
    const onChange = jest.fn();
    render(<ExamModeSwitcher value="ygs" onChange={onChange} />);

    expect(screen.getByText('Aktif sınav modu')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-chip')).toBeTruthy();
    expect(screen.getByText('MOD: YGS')).toBeTruthy();
    expect(screen.getByTestId('exam-mode-active-line')).toBeTruthy();
    expect(screen.getByText(/YGS modundasın/i)).toBeTruthy();
    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
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

  it('updates MOD chip when value is KPSS', () => {
    render(<ExamModeSwitcher value="kpss" onChange={jest.fn()} />);
    expect(screen.getByText('MOD: KPSS')).toBeTruthy();
    expect(screen.getByText(/KPSS modundasın/i)).toBeTruthy();
  });

  it('updates MOD chip when value is Ehliyet', () => {
    render(<ExamModeSwitcher value="trafik" onChange={jest.fn()} />);
    expect(screen.getByText('MOD: EHLİYET')).toBeTruthy();
    expect(screen.getByText(/Ehliyet modundasın/i)).toBeTruthy();
  });
});
