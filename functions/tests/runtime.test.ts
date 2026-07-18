describe('runtime demo mode', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  it('defaults to demo when GEMINI_API_KEY missing', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.COZBIL_DEMO_AI;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDemoAiMode, runtimeModeLabel } = require('../src/config/runtime');
    expect(isDemoAiMode()).toBe(true);
    expect(runtimeModeLabel()).toBe('demo');
  });

  it('uses live when key present and demo not forced', () => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.COZBIL_DEMO_AI = '0';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDemoAiMode } = require('../src/config/runtime');
    expect(isDemoAiMode()).toBe(false);
  });
});
