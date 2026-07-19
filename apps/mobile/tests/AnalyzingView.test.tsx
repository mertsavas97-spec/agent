import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { AnalyzingView } from '@/src/features/solve/AnalyzingView';
import { progressForStep } from '@/src/features/solve/analyzeSteps';

describe('AnalyzingView', () => {
  it('shows analyzing copy, progress bar, and pipeline steps', () => {
    render(<AnalyzingView step="moderate" />);
    expect(screen.getByTestId('analyzing-view')).toBeTruthy();
    expect(screen.getByText(/Sorun analiz ediliyor/)).toBeTruthy();
    expect(screen.getByTestId('analyzing-wait')).toHaveTextContent(/birkaç saniye/);
    expect(screen.getByTestId('analyzing-progress-bar')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-label')).toHaveTextContent(/Güvenli/);
    expect(screen.getByTestId('cozbil-robot')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-upload')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-moderate')).toBeTruthy();
    expect(screen.getByTestId('analyzing-step-solve')).toBeTruthy();
  });

  it('maps step ids to increasing progress', () => {
    expect(progressForStep('upload')).toBeLessThan(progressForStep('moderate'));
    expect(progressForStep('moderate')).toBeLessThan(progressForStep('solve'));
  });
});
