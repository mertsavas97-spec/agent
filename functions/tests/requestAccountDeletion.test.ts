import { buildDefaultUserDoc } from '../src/users/bootstrapUser';

describe('account deletion request fields', () => {
  it('defaults deleteRequestedAt to null on new users', () => {
    const doc = buildDefaultUserDoc({ uid: 'u1', examType: 'ygs' });
    expect(doc.deleteRequestedAt).toBeNull();
  });
});
