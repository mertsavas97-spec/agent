import { callSolveQuestionViaProxy } from '@/src/features/solve/solveViaProxy';

describe('callSolveQuestionViaProxy', () => {
  const originalUrl = process.env.EXPO_PUBLIC_SOLVE_PROXY_URL;
  const originalToken = process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SOLVE_PROXY_URL = 'https://solve.example';
    process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN = 'test-dogfood-token';
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_SOLVE_PROXY_URL = originalUrl;
    process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN = originalToken;
  });

  it('omits a large inline image when a Storage URL is available', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          status: 'solved',
          attemptId: 'a1',
          solutionId: 's1',
          cached: false,
          topicId: 'lgs-math-kesirler',
          subject: 'math',
          steps: [{ title: 'Cevap', body: 'Doğru şık: B) 3' }],
          answer: { label: 'B', text: '3' },
          transparencyNote: 'ok',
          quota: { remainingToday: 4, unlimited: false },
        }),
    } as Response);

    await callSolveQuestionViaProxy({
      requestId: 'r1',
      examType: 'lgs',
      imageUrl: 'https://storage.example/question.jpg',
      imageBase64: 'x'.repeat(6_500_000),
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body.imageUrl).toBe('https://storage.example/question.jpg');
    expect(body.imageBase64).toBeUndefined();
  });

  it('keeps a small inline image when no URL is available', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          status: 'unsupported_type',
          attemptId: 'a2',
          userMessage: 'okunamadı',
          quota: { remainingToday: 5, unlimited: false },
        }),
    } as Response);

    await callSolveQuestionViaProxy({
      requestId: 'r2',
      examType: 'ygs',
      imageBase64: 'a'.repeat(100),
    });

    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body.imageBase64).toHaveLength(100);
  });

  it('rejects a large inline image before network when no URL is available', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');

    await expect(
      callSolveQuestionViaProxy({
        requestId: 'r3',
        examType: 'kpss',
        imageBase64: 'x'.repeat(3_500_001),
      }),
    ).rejects.toMatchObject({ code: 'functions/invalid-argument' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a local phone image as binary without base64 expansion', async () => {
    const blob = { size: 1_000_000, type: 'image/jpeg' } as Blob;
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ blob: async () => blob } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            status: 'solved',
            attemptId: 'a-binary',
            solutionId: 's-binary',
            cached: false,
            topicId: 'lgs-math-kesirler',
            subject: 'math',
            steps: [{ title: 'Cevap', body: 'Doğru şık: B) 3' }],
            answer: { label: 'B', text: '3' },
            transparencyNote: 'ok',
            quota: { remainingToday: 5, unlimited: false },
          }),
      } as Response);

    await callSolveQuestionViaProxy({
      requestId: 'binary-r1',
      examType: 'lgs',
      imageUri: 'file://phone-photo.jpg',
      mimeType: 'image/jpeg',
    });

    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://solve.example/solve-image');
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(blob);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      'Content-Type': 'image/jpeg',
      'X-Cozbil-Exam-Type': 'lgs',
      'X-Cozbil-Request-Id': 'binary-r1',
    });
  });

  it('forces image/jpeg when RN blob.type is empty', async () => {
    const blob = { size: 1200, type: '' };
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ blob: async () => blob } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            status: 'solved',
            attemptId: 'a-empty-type',
            solutionId: 's-empty-type',
            cached: false,
            topicId: 'lgs-math-kesirler',
            subject: 'math',
            steps: [{ title: 'Cevap', body: 'Doğru şık: B) 3' }],
            answer: { label: 'B', text: '3' },
            transparencyNote: 'ok',
            quota: { remainingToday: 5, unlimited: false },
          }),
      } as Response);

    await callSolveQuestionViaProxy({
      requestId: 'empty-type',
      examType: 'ygs',
      imageUri: 'file://phone-photo.jpg',
      // mimeType omitted — reproduces iOS empty blob.type path
    });

    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      'Content-Type': 'image/jpeg',
    });
  });
});
