describe('runtime demo mode', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  it('defaults to demo when no key and no Vertex', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.COZBIL_DEMO_AI;
    delete process.env.COZBIL_USE_VERTEX;
    delete process.env.FUNCTION_TARGET;
    delete process.env.K_SERVICE;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDemoAiMode, runtimeModeLabel } = require('../src/config/runtime');
    expect(isDemoAiMode()).toBe(true);
    expect(runtimeModeLabel()).toBe('demo');
  });

  it('uses live when AI Studio key present and demo not forced', () => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.COZBIL_DEMO_AI = '0';
    delete process.env.COZBIL_USE_VERTEX;
    delete process.env.FUNCTION_TARGET;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDemoAiMode, liveBackendLabel } = require('../src/config/runtime');
    expect(isDemoAiMode()).toBe(false);
    expect(liveBackendLabel()).toBe('ai_studio');
  });

  it('does not enable Vertex merely because Cloud Functions env is set', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.COZBIL_DEMO_AI;
    delete process.env.COZBIL_USE_VERTEX;
    process.env.K_SERVICE = 'onSolveRequestCreatedV2';
    process.env.FUNCTION_TARGET = 'onSolveRequestCreatedV2';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDemoAiMode, liveBackendLabel, useVertexAi } = require('../src/config/runtime');
    expect(useVertexAi()).toBe(false);
    expect(isDemoAiMode()).toBe(true);
    expect(liveBackendLabel()).toBe('demo');
  });

  it('uses Vertex when COZBIL_USE_VERTEX=1', () => {
    delete process.env.GEMINI_API_KEY;
    process.env.COZBIL_USE_VERTEX = '1';
    delete process.env.COZBIL_DEMO_AI;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDemoAiMode, liveBackendLabel } = require('../src/config/runtime');
    expect(isDemoAiMode()).toBe(false);
    expect(liveBackendLabel()).toBe('vertex');
  });

  it('blocks demo AI on cloud without override', () => {
    process.env.COZBIL_DEMO_AI = '1';
    process.env.K_SERVICE = 'solveQuestion';
    delete process.env.COZBIL_ALLOW_DEMO_IN_PROD;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { assertDemoAiAllowedInRuntime } = require('../src/config/runtime');
    expect(() => assertDemoAiAllowedInRuntime()).toThrow(/COZBIL_DEMO_AI/);
  });

  it('requires Vision key in live mode', () => {
    process.env.COZBIL_DEMO_AI = '0';
    process.env.GEMINI_API_KEY = 'k';
    delete process.env.GOOGLE_CLOUD_VISION_API_KEY;
    delete process.env.COZBIL_ALLOW_OPEN_VISION;
    delete process.env.COZBIL_USE_VERTEX;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { assertVisionConfiguredForLive } = require('../src/config/runtime');
    expect(() => assertVisionConfiguredForLive()).toThrow(/VISION/);
  });
});
