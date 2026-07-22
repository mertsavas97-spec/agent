import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { AnalyzingView } from '@/src/features/solve/AnalyzingView';
import { progressForStep } from '@/src/features/solve/analyzeSteps';

describe('AnalyzingView', () => {
  it('shows analyzing copy, progress bar, and pipeline steps', () => {
    render(<AnalyzingView step="moderate" />);
    expect(screen.getByTestId('analyzing-view')).toBeTruthy();
    expect(screen.getByTestId('analyzing-title')).toBeTruthy();
    expect(screen.getByTestId('analyzing-wait')).toBeTruthy();
    expect(screen.getByTestId('analyzing-progress-bar')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-label')).toHaveTextContent(/Güvenli/);
    expect(screen.getByTestId('cozbil-robot')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-upload')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-moderate')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-solve')).toBeTruthy();
  });

  it('shows brand icon on a contrast plate', () => {
    render(<AnalyzingView step="solve" />);
    expect(screen.getByTestId('analyzing-icon-plate')).toBeTruthy();
    expect(screen.getByTestId('analyzing-hero')).toBeTruthy();
    expect(screen.getByTestId('cozbil-robot')).toBeTruthy();
  });

  it('surfaces live pipeline headline when provided', () => {
    render(
      <AnalyzingView
        step="solve"
        live={{
          phase: 'ocr',
          step: 'upload',
          headline: 'Metin okunuyor…',
          detail: 'Fotoğraftaki soru satırlarını ayıklıyorum.',
          tip: 'El yazısı veya bulanık ışık okumayı yavaşlatabilir.',
        }}
      />,
    );
    expect(screen.getByTestId('analyzing-title')).toHaveTextContent(/Metin okunuyor/);
    expect(screen.getByTestId('analyzing-tip')).toHaveTextContent(/El yazısı/);
  });
});
