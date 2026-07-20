import {
  applyExamOverride,
  applySubjectOverride,
  remapTopicIdForExam,
  shouldConfirmExamMismatch,
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

  it('skips confirm for high-confidence Trafik branşı', () => {
    expect(
      shouldConfirmSubject(
        baseSolved({
          subject: 'traffic',
          topicId: 'trafik-traffic-kurallar',
          classification: {
            subject: 'traffic',
            confidence: 'high',
            needsConfirm: true,
          },
        }),
        { examType: 'trafik' },
      ),
    ).toBe(false);
  });

  it('skips confirm for medium-confidence Ehliyet branşı', () => {
    expect(
      shouldConfirmSubject(
        baseSolved({
          subject: 'vehicle',
          topicId: 'trafik-vehicle-motor',
          classification: {
            subject: 'vehicle',
            confidence: 'medium',
            needsConfirm: true,
          },
        }),
        { examType: 'trafik' },
      ),
    ).toBe(false);
  });
});

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
