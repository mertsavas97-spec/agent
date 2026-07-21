import { makeMemoryCache } from '../src/cache/solutionCache';
import { createStubSolver } from '../src/solve/geminiSolve';
import { runSolveQuestion } from '../src/solve/solveQuestion';
import type { VisionClient } from '../src/moderation/visionClient';

const cleanVision: VisionClient = {
  source: 'stub',
  async safeSearch() {
    return { adult: 'VERY_UNLIKELY', violence: 'VERY_UNLIKELY', racy: 'VERY_UNLIKELY' };
  },
};

const dirtyVision: VisionClient = {
  source: 'stub',
  async safeSearch() {
    return { adult: 'VERY_LIKELY', violence: 'UNLIKELY', racy: 'POSSIBLE' };
  },
};

function deps(vision: VisionClient = cleanVision) {
  let n = 0;
  return {
    vision,
    solver: createStubSolver(),
    cache: makeMemoryCache(),
    loadQuota: async () =>
      ({
        dailySolveCount: 0,
        dailySolveDate: null,
        subscriptionStatus: 'free' as const,
      }),
    persistSolved: async () => ({
      attemptId: `a${(n += 1)}`,
      solutionId: `s${n}`,
    }),
    persistRejected: async () => ({ attemptId: `r${(n += 1)}` }),
  };
}

describe('runSolveQuestion', () => {
  it('rejects moderation without consuming quota remaining drop on reject', async () => {
    const result = await runSolveQuestion(
      {
        uid: 'u1',
        imagePath: 'users/u1/uploads/1.jpg',
        imageBuffer: Buffer.from('img'),
        examType: 'lgs',
      },
      deps(dirtyVision),
    );
    expect(result.status).toBe('rejected_moderation');
    if (result.status !== 'solved') {
      expect(result.quota.remainingToday).toBe(5);
    }
  });

  it('returns stepped solution on clean image', async () => {
    const result = await runSolveQuestion(
      {
        uid: 'u1',
        imagePath: 'users/u1/uploads/1.jpg',
        imageBuffer: Buffer.from('clean-image-bytes'),
        examType: 'lgs',
      },
      deps(),
    );
    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.transparencyNote).toContain('AI');
      expect(result.cached).toBe(false);
    }
  });

  it('returns cached solution on second identical image', async () => {
    const d = { ...deps(), writeCacheEnabled: true as const };
    const buf = Buffer.from('same-bytes-for-cache');
    const input = {
      uid: 'u1',
      imagePath: 'users/u1/uploads/1.jpg',
      imageBuffer: buf,
      examType: 'lgs' as const,
    };
    const first = await runSolveQuestion(input, d);
    const second = await runSolveQuestion(input, d);
    expect(first.status).toBe('solved');
    expect(second.status).toBe('solved');
    if (second.status === 'solved') {
      expect(second.cached).toBe(true);
    }
  });
});
