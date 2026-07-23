import {
  examModeMismatchMessage,
  inferForeignExamFromResponse,
  resolveExamModeBlock,
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
    answer: { text: 'ok' },
    transparencyNote: 'ok',
    quota: { remainingToday: 5, unlimited: false },
    ...over,
  };
}

describe('examModeMismatchMessage', () => {
  it('names active vs detected packages in Turkish', () => {
    expect(examModeMismatchMessage('ygs', 'trafik')).toMatch(/YGS/i);
    expect(examModeMismatchMessage('ygs', 'trafik')).toMatch(/Ehliyet/i);
    expect(examModeMismatchMessage('kpss', 'trafik')).toMatch(/modu değiştir/i);
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

  it('detects Ehliyet when KPSS is active', () => {
    expect(
      inferForeignExamFromResponse(
        solved({
          subject: 'vehicle',
          topicId: 'trafik-vehicle-motor',
        }),
        'kpss',
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

  it.each([
    ['lgs', 'ygs', 'ygs-math-temel', 'math'],
    ['lgs', 'kpss', 'kpss-turkish-anlam', 'turkish'],
    ['lgs', 'trafik', 'trafik-traffic-kurallar', 'traffic'],
    ['ygs', 'lgs', 'lgs-math-kesirler', 'math'],
    ['ygs', 'kpss', 'kpss-math-temel', 'math'],
    ['ygs', 'trafik', 'trafik-firstaid-temel', 'firstaid'],
    ['kpss', 'lgs', 'lgs-turkish-paragraf', 'turkish'],
    ['kpss', 'ygs', 'ygs-physics-kuvvet', 'physics'],
    ['kpss', 'trafik', 'trafik-vehicle-motor', 'vehicle'],
    ['trafik', 'lgs', 'lgs-math-kesirler', 'math'],
    ['trafik', 'ygs', 'ygs-chemistry-mol', 'chemistry'],
    ['trafik', 'kpss', 'kpss-history-inkilap', 'history'],
  ] as const)(
    'blocks %s → %s via topic prefix',
    (active, expected, topicId, subject) => {
      expect(
        inferForeignExamFromResponse(
          solved({ topicId, subject }),
          active,
        ),
      ).toBe(expected);
    },
  );

  it('blocks academic subject under Ehliyet even without topicId', () => {
    expect(
      inferForeignExamFromResponse(
        solved({ topicId: null, subject: 'math' }),
        'trafik',
      ),
    ).toBe('lgs');
    expect(
      inferForeignExamFromResponse(
        solved({ topicId: null, subject: 'turkish' }),
        'trafik',
      ),
    ).toBe('kpss');
  });
});

describe('resolveExamModeBlock', () => {
  it('blocks cross-exam without exposing solution', () => {
    const block = resolveExamModeBlock(
      'kpss',
      solved({ subject: 'traffic', topicId: 'trafik-traffic-kurallar' }),
    );
    expect(block.blocked).toBe(true);
    if (block.blocked) {
      expect(block.detectedExam).toBe('trafik');
      expect(block.headline).toMatch(/Ehliyet/i);
    }
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
      expect(out.headline).toMatch(/Ehliyet/i);
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
