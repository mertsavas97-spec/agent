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

  it('uses Vertex when COZBIL_USE_VERTEX=1', () => {
    delete process.env.GEMINI_API_KEY;
    process.env.COZBIL_USE_VERTEX = '1';
    delete process.env.COZBIL_DEMO_AI;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDemoAiMode, liveBackendLabel } = require('../src/config/runtime');
    expect(isDemoAiMode()).toBe(false);
    expect(liveBackendLabel()).toBe('vertex');
  });
});
