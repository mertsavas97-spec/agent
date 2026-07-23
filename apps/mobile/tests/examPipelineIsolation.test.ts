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
    answer: { text: 'ok' },
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

  it('throws on leaked Ehliyet topic under KPSS', () => {
    expect(() =>
      enforceExamPipeline(
        solved({
          subject: 'traffic',
          topicId: 'trafik-traffic-kurallar',
          answer: { label: 'A', text: 'hazırlanmalı' },
        }),
        'kpss',
      ),
    ).toThrow(/EXAM_PIPELINE_MISMATCH/);
  });

  it('throws on leaked Turkish topic under Ehliyet', () => {
    expect(() =>
      enforceExamPipeline(
        solved({
          subject: 'turkish',
          topicId: 'kpss-turkish-paragraf',
          answer: { text: 'öyküleme' },
        }),
        'trafik',
      ),
    ).toThrow(/EXAM_PIPELINE_MISMATCH/);
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
