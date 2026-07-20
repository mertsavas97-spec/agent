import { decideClaim } from '../src/solve/processSolveRequest';

describe('decideClaim', () => {
  it('claims missing or pending', () => {
    expect(decideClaim(undefined)).toBe('claimed');
    expect(decideClaim('pending')).toBe('claimed');
  });

  it('skips in-flight and terminal states', () => {
    expect(decideClaim('running')).toBe('skip');
    expect(decideClaim('done')).toBe('skip');
    expect(decideClaim('error')).toBe('skip');
  });
});
