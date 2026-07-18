import { buildDefaultUserDoc } from '../src/users/bootstrapUser';

describe('buildDefaultUserDoc', () => {
  it('defaults examType to lgs', () => {
    const doc = buildDefaultUserDoc({ uid: 'u1' });
    expect(doc.examType).toBe('lgs');
    expect(doc.subscriptionStatus).toBe('free');
    expect(doc.streakCount).toBe(0);
    expect(doc.dailySolveCount).toBe(0);
    expect(doc.invalidImageScore).toBe(0);
  });

  it('accepts ygs and kpss', () => {
    expect(buildDefaultUserDoc({ uid: 'u1', examType: 'ygs' }).examType).toBe('ygs');
    expect(buildDefaultUserDoc({ uid: 'u1', examType: 'kpss' }).examType).toBe('kpss');
  });

  it('ignores invalid examType', () => {
    expect(buildDefaultUserDoc({ uid: 'u1', examType: 'yks' }).examType).toBe('lgs');
  });
});
