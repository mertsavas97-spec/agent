import {
  applyExamOverride,
  applySubjectOverride,
  remapTopicIdForExam,
  shouldConfirmExamMismatch,
} from '@/src/features/solve/subjectClassification';
import type { SolveQuestionSuccess } from '@/src/lib/api/types';

function baseSolved(over: Partial<SolveQuestionSuccess> = {}): SolveQuestionSuccess {
  return {
    attemptId: 'a1',
    solutionId: 'proxy-sol-1',
    status: 'solved',
    cached: false,
    topicId: 'kpss-turkish-paragraf',
    subject: 'turkish',
    steps: [{ title: '1', body: 'öyküleme' }],
    answer: { text: 'öyküleme' },
    transparencyNote: 'ok',
    quota: { remainingToday: 5, unlimited: false },
    ...over,
  };
}

describe('shouldConfirmExamMismatch', () => {
  it('prompts when KPSS profile gets a high-Q YGS-like booklet hint', () => {
    expect(
      shouldConfirmExamMismatch(
        {
          suggested: 'ygs',
          confidence: 'high',
          reason: 'question_number_vs_kpss',
          questionNumber: 97,
          mismatchesProfile: true,
        },
        'kpss',
      ),
    ).toBe(true);
  });

  it('skips when profile already matches suggestion', () => {
    expect(
      shouldConfirmExamMismatch(
        {
          suggested: 'ygs',
          confidence: 'high',
          mismatchesProfile: false,
          questionNumber: 97,
        },
        'ygs',
      ),
    ).toBe(false);
  });

  it('skips low-confidence noise', () => {
    expect(
      shouldConfirmExamMismatch(
        {
          suggested: 'ygs',
          confidence: 'low',
          mismatchesProfile: true,
          questionNumber: 42,
        },
        'kpss',
      ),
    ).toBe(false);
  });

  it('ignores stale Q#-only mismatch under Ehliyet profile', () => {
    expect(
      shouldConfirmExamMismatch(
        {
          suggested: 'kpss',
          confidence: 'medium',
          reason: 'question_number_vs_trafik',
          questionNumber: 52,
          mismatchesProfile: true,
        },
        'trafik',
      ),
    ).toBe(false);
  });
});

describe('applyExamOverride', () => {
  it('remaps topic prefix kpss → ygs', () => {
    expect(remapTopicIdForExam('kpss-turkish-anlam', 'kpss', 'ygs')).toBe(
      'ygs-turkish-anlam',
    );
    const out = applyExamOverride(
      baseSolved({ topicId: 'kpss-turkish-anlam' }),
      'kpss',
      'ygs',
    );
    expect(out.topicId).toBe('ygs-turkish-anlam');
    expect(out.examHint?.mismatchesProfile).toBeFalsy();
  });
});

describe('applySubjectOverride', () => {
  it('does not fabricate a solved result for a different guessed subject', () => {
    const out = applySubjectOverride(
      baseSolved({
        subject: 'math',
        topicId: 'kpss-math-temel-islemler',
        steps: [{ body: 'Parantez → çarpma' }],
      }),
      'kpss',
      'turkish',
    );
    expect(out.subject).toBe('math');
    expect(out.topicId).toBe('kpss-math-temel-islemler');
    expect(out.steps[0]?.body).toMatch(/Parantez/i);
  });

  it('keeps steps when confirming same turkish subject', () => {
    const out = applySubjectOverride(baseSolved(), 'kpss', 'turkish');
    expect(out.steps[0]?.body).toMatch(/öyküleme/);
  });

  it('keeps the original verified result instead of remapping firstaid → vehicle', () => {
    const out = applySubjectOverride(
      baseSolved({
        subject: 'firstaid',
        topicId: 'trafik-firstaid-abc',
        answer: { label: 'A', text: 'ABC' },
        steps: [{ title: 'Cevap', body: 'Doğru şık: A) ABC' }],
      }),
      'trafik',
      'vehicle',
    );
    expect(out.subject).toBe('firstaid');
    expect(out.answer).toEqual({ label: 'A', text: 'ABC' });
    expect(out.assisted).toBeUndefined();
    expect(out.topicId).toBe('trafik-firstaid-abc');
    expect(out.steps[0]?.body).toMatch(/ABC/);
  });
});
