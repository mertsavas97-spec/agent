import { createMemoryPersistentRateLimit } from '../src/abuse/persistentRateLimit';

describe('persistent rate limit (memory adapter)', () => {
  it('allows up to maxCalls then throws RateLimitError', async () => {
    const mem = createMemoryPersistentRateLimit();
    const key = 'solve:u-persist';
    const cfg = { maxCalls: 3, windowMs: 60_000 };
    await mem.assert(key, cfg, 1000);
    await mem.assert(key, cfg, 1001);
    await mem.assert(key, cfg, 1002);
    await expect(mem.assert(key, cfg, 1003)).rejects.toMatchObject({
      name: 'RateLimitError',
    });
  });

  it('resets after window slides', async () => {
    const mem = createMemoryPersistentRateLimit();
    const key = 'solve:u-slide';
    const cfg = { maxCalls: 2, windowMs: 1000 };
    await mem.assert(key, cfg, 0);
    await mem.assert(key, cfg, 1);
    await expect(mem.assert(key, cfg, 2)).rejects.toMatchObject({ name: 'RateLimitError' });
    await mem.assert(key, cfg, 2000);
  });
});
