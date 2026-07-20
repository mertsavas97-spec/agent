import {
  readOnboardingDoneLocal,
  writeOnboardingDoneLocal,
} from '@/src/features/onboarding/onboardingPreference';

const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k: string) => mockStore.get(k) ?? null),
  setItem: jest.fn(async (k: string, v: string) => {
    mockStore.set(k, v);
  }),
  removeItem: jest.fn(async (k: string) => {
    mockStore.delete(k);
  }),
}));

describe('onboardingPreference', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('defaults to not done', async () => {
    await expect(readOnboardingDoneLocal()).resolves.toBe(false);
  });

  it('writes and clears done flag', async () => {
    await writeOnboardingDoneLocal(true);
    await expect(readOnboardingDoneLocal()).resolves.toBe(true);
    await writeOnboardingDoneLocal(false);
    await expect(readOnboardingDoneLocal()).resolves.toBe(false);
  });
});
