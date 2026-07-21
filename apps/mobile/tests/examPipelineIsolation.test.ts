import {
  enforceExamPipeline,
  isSubjectAllowedForExam,
  topicBelongsToExam,
} from '@/src/features/solve/examPipelineIsolation';
import type { SolveQuestionSuccess } from '@/src/lib/api/types';

function solved(over: Partial<SolveQuestionSuccess> = {}): SolveQuestionSuccess {
  return {
    attemptId: 'a1',
    solutionId: 's1',
    status: 'solved',
    cached: false,
    topicId: 'lgs-math-kesirler',
    subject: 'math',
    steps: [{ title: '1', body: 'ok' }],
    transparencyNote: 'n',
    quota: { remainingToday: 5, unlimited: false },
    ...over,
  };
}

describe('examPipelineIsolation', () => {
  it('rejects trafik subjects under LGS/YGS/KPSS', () => {
    expect(isSubjectAllowedForExam('traffic', 'lgs')).toBe(false);
    expect(isSubjectAllowedForExam('vehicle', 'kpss')).toBe(false);
    expect(isSubjectAllowedForExam('firstaid', 'ygs')).toBe(false);
    expect(isSubjectAllowedForExam('math', 'lgs')).toBe(true);
    expect(isSubjectAllowedForExam('traffic', 'trafik')).toBe(true);
  });

  it('rejects cross-package topic ids', () => {
    expect(topicBelongsToExam('trafik-traffic-kurallar', 'kpss')).toBe(false);
    expect(topicBelongsToExam('kpss-turkish-paragraf', 'trafik')).toBe(false);
    expect(topicBelongsToExam('trafik-vehicle-motor', 'trafik')).toBe(true);
  });

  it('remaps leaked Ehliyet topic out of KPSS result', () => {
    const out = enforceExamPipeline(
      solved({
        subject: 'traffic',
        topicId: 'trafik-traffic-kurallar',
        answer: { label: 'A', text: 'hazırlanmalı' },
      }),
      'kpss',
    );
    expect(out.subject).not.toBe('traffic');
    expect(out.topicId?.startsWith('trafik-')).toBe(false);
    expect(out.topicId?.startsWith('kpss-')).toBe(true);
    expect(out.answer).toBeUndefined();
    expect(out.assisted).toBe(true);
  });

  it('remaps leaked Turkish topic out of Ehliyet result', () => {
    const out = enforceExamPipeline(
      solved({
        subject: 'turkish',
        topicId: 'kpss-turkish-paragraf',
        answer: { text: 'öyküleme' },
      }),
      'trafik',
    );
    expect(['traffic', 'vehicle', 'firstaid']).toContain(out.subject);
    expect(out.topicId?.startsWith('trafik-')).toBe(true);
    expect(out.answer).toBeUndefined();
    expect(out.assisted).toBe(true);
  });

  it('keeps valid Ehliyet vehicle payload intact', () => {
    const input = solved({
      subject: 'vehicle',
      topicId: 'trafik-vehicle-motor',
      answer: { label: 'A', text: 'Şaft' },
    });
    expect(enforceExamPipeline(input, 'trafik')).toEqual(input);
  });
});
