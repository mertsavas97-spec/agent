import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

import { SolutionScreen } from '@/src/features/solve/SolutionScreen';

describe('SolutionScreen', () => {
  it('renders answer hero prominently above tabs', () => {
    render(
      <SolutionScreen
        steps={[
          { title: '1. Soru ne istiyor?', body: 'Anlatım biçimi.' },
          { title: 'Cevap', body: 'En uygun anlatım biçimi: öyküleme' },
        ]}
        answer={{ text: 'öyküleme' }}
        examType="kpss"
        subject="turkish"
        topicName="Paragraf"
        transparencyNote="Metinden okunarak çözüldü."
      />,
    );

    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/öyküleme/);
    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/DOĞRU CEVAP/);
    expect(screen.getByTestId('solution-meta')).toHaveTextContent(/Türkçe/);
    // Cevap card should not duplicate in steps tab
    expect(screen.queryByText('En uygun anlatım biçimi: öyküleme')).toBeNull();
    expect(screen.getByTestId('step-0')).toHaveTextContent(/Anlatım biçimi/);
  });

  it('falls back to extracting answer from steps when answer prop missing', () => {
    render(
      <SolutionScreen
        steps={[
          { title: '1. Adım', body: 'Paydaları eşitle.' },
          { title: 'Cevap', body: 'Doğru şık: E) 7.' },
        ]}
      />,
    );
    expect(screen.getByTestId('answer-hero')).toHaveTextContent(/E\) 7/);
  });

  it('short tab leads with bold answer', () => {
    render(
      <SolutionScreen
        steps={[
          { title: '3. Neden', body: 'Zaman zinciri.' },
          { title: 'Cevap', body: 'En uygun anlatım biçimi: öyküleme' },
        ]}
        answer={{ text: 'öyküleme' }}
      />,
    );
    fireEvent.press(screen.getByTestId('tab-short'));
    expect(screen.getByTestId('short-summary')).toHaveTextContent(/öyküleme/);
    expect(screen.getByTestId('short-summary')).toHaveTextContent(/Zaman zinciri/);
  });

  it('shows follow-up text after explain again', async () => {
    const onExplainAgain = jest.fn().mockResolvedValue('Daha sade: payları topla.');
    render(
      <SolutionScreen
        steps={[{ title: '1', body: 'x' }]}
        solutionId="sol-1"
        onExplainAgain={onExplainAgain}
      />,
    );

    fireEvent.press(screen.getByTestId('explain-again-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('follow-up-text')).toHaveTextContent(
        /Daha sade: payları topla/,
      );
    });
    expect(onExplainAgain).toHaveBeenCalled();
  });

  it('highlights matching lesson bullet for the answer', () => {
    render(
      <SolutionScreen
        steps={[{ title: '1', body: 'x' }]}
        answer={{ text: 'öyküleme' }}
        topicLesson={{
          topicId: 'kpss-turkish-paragraf',
          headline: 'Paragraf ve anlatım biçimleri',
          bullets: [
            'Öyküleme: olayları zaman içinde anlatır.',
            'Betimleme: duyularla resmeder.',
          ],
          tip: 'Eylem/zaman mı bak.',
        }}
      />,
    );
    fireEvent.press(screen.getByTestId('tab-lesson'));
    expect(screen.getByTestId('topic-lesson')).toHaveTextContent(/Öyküleme/);
    expect(screen.getByTestId('topic-lesson')).toHaveTextContent(/İpucu|İPUCU/i);
  });

  it('shows assisted honesty banner when assisted', () => {
    render(
      <SolutionScreen
        steps={[{ title: '1', body: 'Sistemi tanı' }]}
        assisted
        examType="trafik"
        subject="vehicle"
      />,
    );
    expect(screen.getByTestId('assisted-banner')).toHaveTextContent(
      /Tam otomatik cevap yok/,
    );
  });
});
