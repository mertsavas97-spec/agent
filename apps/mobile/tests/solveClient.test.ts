import { callSolveQuestion } from '@/src/features/solve/solveClient';
import { callSolveQuestionViaFirestore } from '@/src/features/solve/solveViaFirestore';
import { callSolveQuestionViaProxy } from '@/src/features/solve/solveViaProxy';
import type { SolveQuestionResponse } from '@/src/lib/api/types';

jest.mock('@/src/features/solve/solveViaFirestore', () => ({
  callSolveQuestionViaFirestore: jest.fn(),
}));

jest.mock('@/src/features/solve/solveViaProxy', () => ({
  isSolveProxyConfigured: jest.fn(() => true),
  callSolveQuestionViaProxy: jest.fn(),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

const proxyMock = callSolveQuestionViaProxy as jest.MockedFunction<
  typeof callSolveQuestionViaProxy
>;
const firestoreMock = callSolveQuestionViaFirestore as jest.MockedFunction<
  typeof callSolveQuestionViaFirestore
>;

const request = {
  imagePath: 'users/u/uploads/r1.jpg',
  imageUrl: 'https://storage.example/r1.jpg',
  requestId: 'r1',
  examType: 'lgs' as const,
};

describe('callSolveQuestion orchestration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not create duplicate Firestore work while the proxy is running', async () => {
    let resolveProxy!: (value: Awaited<ReturnType<typeof callSolveQuestionViaProxy>>) => void;
    proxyMock.mockReturnValue(
      new Promise((resolve) => {
        resolveProxy = resolve;
      }),
    );
    firestoreMock.mockResolvedValue({
      status: 'solved',
      attemptId: 'firestore-a',
      solutionId: 'firestore-s',
      cached: false,
      topicId: 'lgs-math-kesirler',
      subject: 'math',
      steps: [{ title: 'Cevap', body: 'Doğru şık: B) 3' }],
      answer: { label: 'B', text: '3' },
      transparencyNote: 'ok',
      quota: { remainingToday: 4, unlimited: false },
    });

    const pending = callSolveQuestion(request);
    await Promise.resolve();

    expect(firestoreMock).not.toHaveBeenCalled();

    resolveProxy({
      status: 'unsupported_type',
      attemptId: 'proxy-a',
      userMessage: 'okunamadı',
      quota: { remainingToday: 5, unlimited: false },
    });
    await expect(pending).resolves.toMatchObject({
      status: 'rejected_not_question',
      attemptId: 'proxy-a',
    });
    expect(firestoreMock).not.toHaveBeenCalled();
  });

  it('does not upload to the Storage trigger path when proxy solves', async () => {
    const prepareFirestore = jest.fn();
    proxyMock.mockResolvedValue({
      status: 'solved',
      attemptId: 'proxy-a',
      solutionId: 'proxy-s',
      cached: false,
      topicId: 'lgs-math-kesirler',
      subject: 'math',
      steps: [{ title: 'Cevap', body: 'Doğru şık: B) 3' }],
      answer: { label: 'B', text: '3' },
      transparencyNote: 'ok',
      quota: { remainingToday: 5, unlimited: false },
    });

    await expect(
      callSolveQuestion({
        requestId: 'lazy-r1',
        examType: 'lgs',
        imageBase64: 'small-inline-image',
        prepareFirestore,
      }),
    ).resolves.toMatchObject({ solutionId: 'proxy-s' });

    expect(prepareFirestore).not.toHaveBeenCalled();
    expect(firestoreMock).not.toHaveBeenCalled();
  });

  it('returns terminal unsupported without hanging on Storage upload', async () => {
    const prepareFirestore = jest.fn().mockImplementation(
      () => new Promise(() => {}),
    );
    proxyMock.mockResolvedValue({
      status: 'unsupported_type',
      attemptId: 'proxy-unsup-lazy',
      userMessage: 'okunamadı',
      quota: { remainingToday: 5, unlimited: false },
    });

    await expect(
      callSolveQuestion({
        requestId: 'lazy-r2',
        examType: 'lgs',
        imageBase64: 'small-inline-image',
        prepareFirestore,
      }),
    ).resolves.toMatchObject({
      status: 'rejected_not_question',
      attemptId: 'proxy-unsup-lazy',
    });

    expect(prepareFirestore).not.toHaveBeenCalled();
    expect(firestoreMock).not.toHaveBeenCalled();
  });

  it('does not disguise two unavailable backends as a solved result', async () => {
    proxyMock.mockRejectedValue(
      Object.assign(new Error('proxy offline'), { code: 'functions/unavailable' }),
    );
    firestoreMock.mockRejectedValue(
      Object.assign(new Error('SOLVE_TRIGGER_MISSING'), {
        code: 'functions/unavailable',
      }),
    );

    await expect(callSolveQuestion(request)).rejects.toThrow(/çözüm servisine|unavailable/i);
  });

  it('returns honest rejected response when proxy cannot OCR the image', async () => {
    proxyMock.mockResolvedValue({
      status: 'unsupported_type',
      attemptId: 'proxy-unsup',
      userMessage: 'Bu soru otomatik çözülemedi.',
      quota: { remainingToday: 5, unlimited: false },
    });

    await expect(callSolveQuestion(request)).resolves.toMatchObject({
      status: 'rejected_not_question',
      attemptId: 'proxy-unsup',
    });
    expect(firestoreMock).not.toHaveBeenCalled();
  });

  it('does not accept a solved payload without a final answer', async () => {
    proxyMock.mockResolvedValue({
      status: 'solved',
      attemptId: 'proxy-tip',
      solutionId: 'proxy-tip-s',
      cached: false,
      topicId: 'lgs-math-kesirler',
      subject: 'math',
      steps: [{ title: '1. İpucu', body: 'Kesirleri sırayla uygula.' }],
      transparencyNote: 'ok',
      quota: { remainingToday: 5, unlimited: false },
    } as unknown as SolveQuestionResponse);
    firestoreMock.mockRejectedValue(
      Object.assign(new Error('SOLVE_TRIGGER_MISSING'), {
        code: 'functions/unavailable',
      }),
    );

    await expect(callSolveQuestion(request)).rejects.toThrow(/nihai cevap|çözüm servisine/i);
  });

  it('accepts solved payloads with label-only answers', async () => {
    proxyMock.mockResolvedValue({
      status: 'solved',
      attemptId: 'proxy-label',
      solutionId: 'proxy-label-s',
      cached: false,
      topicId: 'lgs-math-kesirler',
      subject: 'math',
      steps: [{ title: 'Cevap', body: 'Doğru şık: B' }],
      answer: { label: 'B', text: '' },
      transparencyNote: 'ok',
      quota: { remainingToday: 5, unlimited: false },
    } as unknown as SolveQuestionResponse);

    await expect(callSolveQuestion(request)).resolves.toMatchObject({
      status: 'solved',
      answer: { label: 'B' },
    });
    expect(firestoreMock).not.toHaveBeenCalled();
  });

  it('maps proxy OCR failures to rejected_not_question instead of unavailable', async () => {
    proxyMock.mockRejectedValue(
      Object.assign(new Error('OCR unavailable (tesseract: empty)'), {
        code: 'functions/internal',
      }),
    );

    await expect(callSolveQuestion(request)).resolves.toMatchObject({
      status: 'rejected_not_question',
    });
    expect(firestoreMock).not.toHaveBeenCalled();
  });

  it('hard-times out a hung Storage upload during Firestore fallback', async () => {
    jest.useFakeTimers();
    proxyMock.mockRejectedValue(
      Object.assign(new Error('proxy tunnel down'), { code: 'functions/unavailable' }),
    );
    const prepareFirestore = jest.fn().mockImplementation(
      () => new Promise(() => {}),
    );

    const pending = callSolveQuestion({
      requestId: 'hang-r1',
      examType: 'lgs',
      imageBase64: 'x',
      prepareFirestore,
    });
    const expectation = expect(pending).rejects.toThrow(/SOLVE_TIMEOUT|Storage upload/i);
    await jest.advanceTimersByTimeAsync(13_000);
    await expectation;
    jest.useRealTimers();
  });
});
