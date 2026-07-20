import {
  examModeMismatchMessage,
  inferForeignExamFromResponse,
  shouldRejectBatchSlotForExamMode,
} from '@/src/features/solve/examModeGuard';
import type { SolveQuestionResponse, SolveQuestionSuccess } from '@/src/lib/api/types';

function solved(over: Partial<SolveQuestionSuccess> = {}): SolveQuestionSuccess {
  return {
    attemptId: 'a1',
    solutionId: 'proxy-sol-1',
    status: 'solved',
    cached: false,
    topicId: 'ygs-math-temel',
    subject: 'math',
    steps: [{ title: '1', body: 'ok' }],
    transparencyNote: 'ok',
    quota: { remainingToday: 5, unlimited: false },
    ...over,
  };
}

describe('examModeMismatchMessage', () => {
  it('names active vs detected packages in Turkish', () => {
    expect(examModeMismatchMessage('ygs', 'trafik')).toMatch(/YGS/i);
    expect(examModeMismatchMessage('ygs', 'trafik')).toMatch(/Ehliyet/i);
    expect(examModeMismatchMessage('ygs', 'trafik')).toMatch(/ait değil/i);
  });
});

describe('inferForeignExamFromResponse', () => {
  it('detects Ehliyet from trafik subjects when YGS is active', () => {
    expect(
      inferForeignExamFromResponse(
        solved({
          subject: 'traffic',
          topicId: 'trafik-traffic-kurallar',
        }),
        'ygs',
      ),
    ).toBe('trafik');
  });

  it('detects from examHint mismatch', () => {
    expect(
      inferForeignExamFromResponse(
        solved({
          examHint: {
            suggested: 'trafik',
            confidence: 'high',
            mismatchesProfile: true,
            reason: 'ocr',
          },
        }),
        'ygs',
      ),
    ).toBe('trafik');
  });

  it('detects from topic prefix alone', () => {
    expect(
      inferForeignExamFromResponse(
        solved({ topicId: 'kpss-turkish-anlam', subject: 'turkish' }),
        'lgs',
      ),
    ).toBe('kpss');
  });

  it('returns null when content matches active mode', () => {
    expect(
      inferForeignExamFromResponse(
        solved({ topicId: 'ygs-turkish-paragraf', subject: 'turkish' }),
        'ygs',
      ),
    ).toBeNull();
  });
});

describe('shouldRejectBatchSlotForExamMode', () => {
  it('rejects YGS batch slot that looks like Ehliyet', () => {
    const out = shouldRejectBatchSlotForExamMode(
      'ygs',
      solved({
        subject: 'vehicle',
        topicId: 'trafik-vehicle-motor',
        examHint: {
          suggested: 'trafik',
          confidence: 'high',
          mismatchesProfile: true,
        },
      }),
    );
    expect(out.reject).toBe(true);
    if (out.reject) {
      expect(out.detected).toBe('trafik');
      expect(out.message).toMatch(/YGS/i);
      expect(out.message).toMatch(/Ehliyet/i);
    }
  });

  it('accepts matching package', () => {
    const out = shouldRejectBatchSlotForExamMode(
      'kpss',
      solved({ topicId: 'kpss-math-temel', subject: 'math' }),
    );
    expect(out.reject).toBe(false);
  });

  it('rejects unsupported_type status with strong mismatch hint', () => {
    const unsupported: SolveQuestionResponse = {
      attemptId: 'a-unsup',
      status: 'unsupported_type',
      userMessage: 'okunamadı',
      quota: { remainingToday: 5, unlimited: false },
      examHint: {
        suggested: 'lgs',
        confidence: 'medium',
        mismatchesProfile: true,
      },
    };
    const out = shouldRejectBatchSlotForExamMode('ygs', unsupported);
    expect(out.reject).toBe(true);
    if (out.reject) expect(out.detected).toBe('lgs');
  });
});
