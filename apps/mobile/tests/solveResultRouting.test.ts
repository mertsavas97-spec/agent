import { routeSolveResponse } from '@/src/features/solve/solveResultRouting';
import type { SolveQuestionSuccess } from '@/src/lib/api/types';

function solved(over: Partial<SolveQuestionSuccess> = {}): SolveQuestionSuccess {
  return {
    attemptId: 'a1',
    solutionId: 's1',
    status: 'solved',
    cached: false,
    topicId: 'kpss-math-temel-islemler',
    subject: 'math',
    steps: [{ title: 'Cevap', body: 'Doğru şık: A) 90' }],
    answer: { label: 'A', text: '90' },
    transparencyNote: 'ok',
    quota: { remainingToday: 4, unlimited: false },
    ...over,
  };
}

describe('routeSolveResponse', () => {
  it('blocks a foreign exam before active-exam isolation can erase the signal', () => {
    const out = routeSolveResponse(
      solved({
        subject: 'traffic',
        topicId: 'trafik-traffic-kurallar',
        answer: { label: 'B', text: '50' },
      }),
      'kpss',
    );

    expect(out.kind).toBe('examBlocked');
    if (out.kind === 'examBlocked') {
      expect(out.block.detectedExam).toBe('trafik');
    }
  });

  it('blocks a rejected response carrying a strong foreign exam hint', () => {
    const out = routeSolveResponse(
      {
        status: 'unsupported_type',
        attemptId: 'a2',
        userMessage: 'okunamadı',
        quota: { remainingToday: 5, unlimited: false },
        examHint: {
          suggested: 'ygs',
          confidence: 'high',
          mismatchesProfile: true,
        },
      },
      'lgs',
    );

    expect(out.kind).toBe('examBlocked');
  });

  it('does not route an assisted result to subject confirmation', () => {
    const out = routeSolveResponse(
      solved({
        assisted: true,
        classification: {
          subject: 'math',
          confidence: 'low',
          needsConfirm: true,
        },
      }),
      'kpss',
    );

    expect(out.kind).toBe('solved');
  });

  it('never opens a subject guess screen for low-confidence output', () => {
    const out = routeSolveResponse(
      solved({
        classification: {
          subject: 'math',
          confidence: 'medium',
          needsConfirm: true,
        },
      }),
      'kpss',
    );

    expect(out.kind).toBe('solved');
  });
});
