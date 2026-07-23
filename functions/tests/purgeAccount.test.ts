import { purgeAccountData, type PurgeAccountDeps } from '../src/users/purgeAccount';

function memoryDeps(opts?: {
  flagged?: boolean;
  subDocs?: Partial<Record<'attempts' | 'solutions' | 'solveRequests' | 'followUps', string[]>>;
}): PurgeAccountDeps & { deletedAuth: string[]; deletedPrefixes: string[]; deletedUser: boolean } {
  const flagged = opts?.flagged ?? true;
  const subDocs = opts?.subDocs ?? {
    attempts: ['a1'],
    solutions: ['s1'],
    solveRequests: [],
    followUps: [],
  };
  const deletedAuth: string[] = [];
  const deletedPrefixes: string[] = [];
  let deletedUser = false;

  return {
    deletedAuth,
    deletedPrefixes,
    get deletedUser() {
      return deletedUser;
    },
    requireDeleteFlag: true,
    async readDeleteRequested() {
      return flagged;
    },
    async listSubcollectionDocIds(_uid, sub) {
      return subDocs[sub] ?? [];
    },
    async deleteSubcollectionDoc() {
      /* no-op */
    },
    async deleteUserDoc() {
      deletedUser = true;
    },
    async deleteStoragePrefix(prefix) {
      deletedPrefixes.push(prefix);
    },
    async deleteAuthUser(uid) {
      deletedAuth.push(uid);
    },
  };
}

describe('purgeAccountData', () => {
  it('refuses purge without soft-delete flag', async () => {
    const deps = memoryDeps({ flagged: false });
    const result = await purgeAccountData('u1', deps);
    expect(result).toEqual({
      purged: false,
      reason: 'delete_not_requested',
      deletedDocs: 0,
    });
    expect(deps.deletedAuth).toHaveLength(0);
  });

  it('cascades subcollections, storage, user doc, and auth', async () => {
    const deps = memoryDeps();
    const result = await purgeAccountData('u1', deps);
    expect(result.purged).toBe(true);
    expect(result.deletedDocs).toBe(3); // a1 + s1 + user doc
    expect(deps.deletedPrefixes).toEqual(['users/u1/']);
    expect(deps.deletedAuth).toEqual(['u1']);
    expect(deps.deletedUser).toBe(true);
  });
});
