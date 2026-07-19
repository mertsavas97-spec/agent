import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { MultiSolutionScreen } from '@/src/features/solve/MultiSolutionScreen';

describe('MultiSolutionScreen', () => {
  it('switches question tabs without stacking bodies', () => {
    const onChange = jest.fn();
    render(
      <MultiSolutionScreen
        examType="kpss"
        activeId="q1"
        onChangeActive={onChange}
        slots={[
          {
            id: 'q1',
            status: 'ready',
            imageUri: 'file://a.jpg',
            result: {
              attemptId: 'a1',
              solutionId: 'proxy-sol-1',
              status: 'solved',
              cached: false,
              topicId: 'kpss-turkish-paragraf',
              subject: 'turkish',
              steps: [{ title: '1', body: 'birinci' }],
              answer: { text: 'öyküleme' },
              transparencyNote: 'ok',
              quota: { remainingToday: 5, unlimited: false },
            },
          },
          {
            id: 'q2',
            status: 'solving',
            imageUri: 'file://b.jpg',
          },
        ]}
      />,
    );

    expect(screen.getByTestId('multi-batch-progress')).toHaveTextContent('1/2 hazır');
    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/öyküleme/);
    fireEvent.press(screen.getByTestId('multi-q-q2'));
    expect(onChange).toHaveBeenCalledWith('q2');
  });
});
