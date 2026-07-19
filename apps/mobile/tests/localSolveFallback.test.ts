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
    expect(res.steps.length).toBeGreaterThanOrEqual(3);
    expect(res.transparencyNote).toMatch(/Yerel yedek|deploy/i);
    expect(res.topicId).toBe('lgs-math-kesirler');
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
