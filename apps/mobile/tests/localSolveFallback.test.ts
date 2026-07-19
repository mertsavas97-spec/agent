import {
  buildLocalSolveFallback,
  isServerSolveUnavailable,
} from '@/src/features/solve/localSolveFallback';

describe('localSolveFallback', () => {
  it('returns solved response with steps', () => {
    const res = buildLocalSolveFallback({
      examType: 'lgs',
      subjectHint: 'math',
      requestId: '123',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.steps.length).toBeGreaterThanOrEqual(3);
    expect(res.transparencyNote).toMatch(/otomatik çözüm|tekrar/i);
    expect(res.transparencyNote).not.toMatch(/deploy-firestore|bash/i);
    expect(res.topicId).toBe('lgs-math-kesirler');
  });

  it('uses clearer copy when OCR parse is unsupported', () => {
    const res = buildLocalSolveFallback({
      examType: 'lgs',
      requestId: '1',
      reason: 'unsupported',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.transparencyNote).toMatch(/net bir fotoğraf|kadraj/i);
    expect(res.transparencyNote).not.toMatch(/deploy|AI deploy/i);
  });

  it('uses temel işlemler topic for KPSS fallback', () => {
    const res = buildLocalSolveFallback({
      examType: 'kpss',
      requestId: '9',
    });
    expect(res.status).toBe('solved');
    if (res.status !== 'solved') throw new Error('expected solved');
    expect(res.topicId).toBe('kpss-math-temel-islemler');
  });

  it('detects server unavailable errors', () => {
    expect(
      isServerSolveUnavailable(
        Object.assign(new Error('SOLVE_TIMEOUT'), { code: 'functions/deadline-exceeded' }),
      ),
    ).toBe(true);
    expect(
      isServerSolveUnavailable(
        Object.assign(new Error('403'), { code: 'functions/permission-denied' }),
      ),
    ).toBe(true);
    expect(isServerSolveUnavailable(new Error('random'))).toBe(false);
  });
});
