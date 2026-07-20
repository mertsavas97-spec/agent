import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

import { MultiSolutionScreen } from '@/src/features/solve/MultiSolutionScreen';

const slotsReady = [
  {
    id: 'q1',
    status: 'ready' as const,
    imageUri: 'file://a.jpg',
    examType: 'kpss' as const,
    result: {
      attemptId: 'a1',
      solutionId: 'proxy-sol-1',
      status: 'solved' as const,
      cached: false,
      topicId: 'kpss-turkish-paragraf',
      subject: 'turkish' as const,
      steps: [{ title: '1', body: 'birinci' }],
      answer: { text: 'öyküleme', label: 'A' },
      transparencyNote: 'ok',
      quota: { remainingToday: 5, unlimited: false },
    },
  },
  {
    id: 'q2',
    status: 'ready' as const,
    imageUri: 'file://b.jpg',
    examType: 'trafik' as const,
    result: {
      attemptId: 'a2',
      solutionId: 'proxy-sol-2',
      status: 'solved' as const,
      cached: false,
      topicId: 'trafik-traffic-kurallar',
      subject: 'traffic' as const,
      steps: [{ title: '1', body: 'ikinci' }],
      answer: { text: 'Durur', label: 'C' },
      transparencyNote: 'ok',
      quota: { remainingToday: 4, unlimited: false },
    },
  },
];

describe('MultiSolutionScreen', () => {
  it('switches question tabs without stacking bodies', () => {
    const onChange = jest.fn();
    render(
      <MultiSolutionScreen
        examType="kpss"
        activeId="q1"
        onChangeActive={onChange}
        slots={[
          slotsReady[0]!,
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

  it('shows per-question exam/subject caption and swaps active answer pane', () => {
    const { rerender } = render(
      <MultiSolutionScreen
        examType="kpss"
        activeId="q1"
        onChangeActive={jest.fn()}
        slots={slotsReady}
      />,
    );

    expect(screen.getByTestId('multi-active-ready')).toBeTruthy();
    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/öyküleme/);
    expect(screen.getByText(/KPSS · Türkçe/)).toBeTruthy();
    expect(screen.getByText(/Ehliyet · Trafik/)).toBeTruthy();

    rerender(
      <MultiSolutionScreen
        examType="kpss"
        activeId="q2"
        onChangeActive={jest.fn()}
        slots={slotsReady}
      />,
    );

    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/Durur/);
    expect(screen.queryByText(/öyküleme/)).toBeNull();
  });

  it('shows exam mismatch warning on wrong-mode slot', () => {
    render(
      <MultiSolutionScreen
        examType="ygs"
        activeId="q-bad"
        onChangeActive={jest.fn()}
        slots={[
          {
            id: 'q-bad',
            status: 'error',
            imageUri: 'file://ehliyet.jpg',
            examType: 'ygs',
            errorKind: 'exam_mismatch',
            errorMessage:
              'Bu soru YGS’ye ait değil; Ehliyet sorusu gibi görünüyor. Ayarlar’dan modu değiştir veya bu fotoğrafı çıkar.',
          },
        ]}
      />,
    );

    expect(screen.getByTestId('multi-slot-error')).toBeTruthy();
    expect(screen.getByText('Seçili moda uymuyor')).toBeTruthy();
    expect(screen.getByText(/YGS/)).toBeTruthy();
    expect(screen.getByText(/Ehliyet/)).toBeTruthy();
    expect(screen.getByText('Uymuyor')).toBeTruthy();
  });
});
