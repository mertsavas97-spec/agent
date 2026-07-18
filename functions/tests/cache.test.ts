import { computePhash } from '../src/cache/phash';
import {
  lookupCache,
  makeMemoryCache,
  writeCache,
} from '../src/cache/solutionCache';

describe('phash cache', () => {
  it('hits cache for identical buffers', async () => {
    const store = makeMemoryCache();
    const buf = Buffer.from('fake-jpeg-bytes-aaaaaaaa');
    const phash = computePhash(buf);

    await writeCache(store, phash, 'lgs', {
      phash,
      topicId: 'lgs-math-kesirler',
      subject: 'math',
      steps: [{ title: '1', body: 'Adım' }],
    });

    const hit = await lookupCache(store, computePhash(buf), 'lgs');
    expect(hit).not.toBeNull();
    expect(hit?.steps[0].body).toBe('Adım');
  });

  it('misses for different exam type', async () => {
    const store = makeMemoryCache();
    const phash = computePhash(Buffer.from('x'));
    await writeCache(store, phash, 'lgs', {
      phash,
      topicId: null,
      subject: 'math',
      steps: [{ body: 'a' }],
    });
    expect(await lookupCache(store, phash, 'ygs')).toBeNull();
  });
});
