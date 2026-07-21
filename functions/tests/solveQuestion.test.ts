import { computePhash } from '../src/cache/phash';
import { makeMemoryCache, writeCache } from '../src/cache/solutionCache';
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

  it('rejects step-only model output without a final answer', async () => {
    const d = deps();
    d.solver = createStubSolver({
      isQuestion: true,
      unsupported: false,
      unsupportedReason: null,
      subject: 'math',
      topicId: 'lgs-math-kesirler',
      steps: [{ title: '1. İpucu', body: 'Kesirleri sırayla uygula.' }],
    });

    const result = await runSolveQuestion(
      {
        uid: 'u1',
        imagePath: 'users/u1/uploads/no-answer.jpg',
        imageBuffer: Buffer.from('no-answer'),
        examType: 'lgs',
      },
      d,
    );

    expect(result.status).toBe('unsupported_type');
  });

  it('regenerates an answerless legacy cache row instead of billing it as solved', async () => {
    const d = deps();
    const imageBuffer = Buffer.from('legacy-answerless-cache');
    const phash = computePhash(imageBuffer);
    await writeCache(d.cache, phash, 'lgs', {
      phash,
      topicId: 'lgs-math-kesirler',
      subject: 'math',
      steps: [{ title: '1. İpucu', body: 'Eski cevap yok.' }],
    });

    const result = await runSolveQuestion(
      {
        uid: 'u1',
        imagePath: 'users/u1/uploads/legacy.jpg',
        imageBuffer,
        examType: 'lgs',
      },
      d,
    );

    expect(result.status).toBe('solved');
    if (result.status === 'solved') {
      expect(result.cached).toBe(false);
      expect(result.answer?.text).toBeTruthy();
    }
  });
});
