import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

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
            examType: 'kpss',
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

  it('shows per-question exam caption and remounts answer when active changes', () => {
    const { rerender } = render(
      <MultiSolutionScreen
        examType="kpss"
        activeId="q1"
        onChangeActive={jest.fn()}
        slots={[
          {
            id: 'q1',
            status: 'ready',
            imageUri: 'file://a.jpg',
            examType: 'kpss',
            result: {
              attemptId: 'a1',
              solutionId: 'proxy-sol-1',
              status: 'solved',
              cached: false,
              topicId: 'kpss-turkish-paragraf',
              subject: 'turkish',
              steps: [{ title: '1', body: 'birinci' }],
              answer: { text: 'öyküleme', label: 'A' },
              transparencyNote: 'ok',
              quota: { remainingToday: 5, unlimited: false },
            },
          },
          {
            id: 'q2',
            status: 'ready',
            imageUri: 'file://b.jpg',
            examType: 'trafik',
            result: {
              attemptId: 'a2',
              solutionId: 'proxy-sol-2',
              status: 'solved',
              cached: false,
              topicId: 'trafik-traffic-kurallar',
              subject: 'traffic',
              steps: [{ title: '1', body: 'ikinci' }],
              answer: { text: 'Durur', label: 'C' },
              transparencyNote: 'ok',
              quota: { remainingToday: 4, unlimited: false },
            },
          },
        ]}
      />,
    );

    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/öyküleme/);
    expect(screen.getByText('KPSS')).toBeTruthy();
    expect(screen.getByText('Ehliyet')).toBeTruthy();

    rerender(
      <MultiSolutionScreen
        examType="kpss"
        activeId="q2"
        onChangeActive={jest.fn()}
        slots={[
          {
            id: 'q1',
            status: 'ready',
            imageUri: 'file://a.jpg',
            examType: 'kpss',
            result: {
              attemptId: 'a1',
              solutionId: 'proxy-sol-1',
              status: 'solved',
              cached: false,
              topicId: 'kpss-turkish-paragraf',
              subject: 'turkish',
              steps: [{ title: '1', body: 'birinci' }],
              answer: { text: 'öyküleme', label: 'A' },
              transparencyNote: 'ok',
              quota: { remainingToday: 5, unlimited: false },
            },
          },
          {
            id: 'q2',
            status: 'ready',
            imageUri: 'file://b.jpg',
            examType: 'trafik',
            result: {
              attemptId: 'a2',
              solutionId: 'proxy-sol-2',
              status: 'solved',
              cached: false,
              topicId: 'trafik-traffic-kurallar',
              subject: 'traffic',
              steps: [{ title: '1', body: 'ikinci' }],
              answer: { text: 'Durur', label: 'C' },
              transparencyNote: 'ok',
              quota: { remainingToday: 4, unlimited: false },
            },
          },
        ]}
      />,
    );

    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/Durur/);
    expect(screen.queryByText(/öyküleme/)).toBeNull();
  });
});
