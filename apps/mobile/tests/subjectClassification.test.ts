import {
  applySubjectOverride,
  shouldConfirmSubject,
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
    transparencyNote: 'ok',
    quota: { remainingToday: 5, unlimited: false },
    ...over,
  };
}

describe('shouldConfirmSubject', () => {
  it('skips confirm when user provided subjectHint', () => {
    expect(
      shouldConfirmSubject(
        baseSolved({
          classification: { subject: 'turkish', confidence: 'low', needsConfirm: true },
        }),
        { subjectHint: 'turkish', examType: 'kpss' },
      ),
    ).toBe(false);
  });

  it('requires confirm on needsConfirm / low confidence', () => {
    expect(
      shouldConfirmSubject(
        baseSolved({
          classification: { subject: 'math', confidence: 'medium', needsConfirm: true },
        }),
        { examType: 'kpss' },
      ),
    ).toBe(true);
  });

  it('skips confirm on high confidence', () => {
    expect(
      shouldConfirmSubject(
        baseSolved({
          classification: { subject: 'turkish', confidence: 'high', needsConfirm: false },
        }),
        { examType: 'kpss' },
      ),
    ).toBe(false);
  });

  it('requires confirm when subject unknown', () => {
    expect(
      shouldConfirmSubject(baseSolved({ subject: 'unknown', topicId: null }), {
        examType: 'lgs',
      }),
    ).toBe(true);
  });
});

describe('applySubjectOverride', () => {
  it('remaps math → turkish metadata and steps', () => {
    const out = applySubjectOverride(
      baseSolved({
        subject: 'math',
        topicId: 'kpss-math-temel-islemler',
        steps: [{ body: 'Parantez → çarpma' }],
      }),
      'kpss',
      'turkish',
    );
    expect(out.subject).toBe('turkish');
    expect(out.topicId).toBe('kpss-turkish-paragraf');
    expect(out.steps[0]?.body).toMatch(/kök|metne|anlatım/i);
  });

  it('keeps steps when confirming same turkish subject', () => {
    const out = applySubjectOverride(baseSolved(), 'kpss', 'turkish');
    expect(out.steps[0]?.body).toMatch(/öyküleme/);
  });
});
