import { markOnboardingComplete } from '@/src/features/onboarding/onboardingReplay';

const mockCompleteOnboardingLocal = jest.fn().mockResolvedValue(undefined);
const mockEnsureUserDocLocal = jest.fn().mockResolvedValue({ created: false, examType: 'lgs' });
const mockWriteExamPreference = jest.fn().mockResolvedValue(undefined);
const mockEnsureSignedIn = jest.fn().mockResolvedValue({ uid: 'u1' });
const mockCallable = jest.fn();

jest.mock('@/src/features/auth/userDocLocal', () => ({
  completeOnboardingLocal: (...args: unknown[]) => mockCompleteOnboardingLocal(...args),
  ensureUserDocLocal: (...args: unknown[]) => mockEnsureUserDocLocal(...args),
  isExamType: (v: unknown) => v === 'lgs' || v === 'ygs' || v === 'kpss' || v === 'trafik',
  resetOnboardingLocal: jest.fn(),
}));

jest.mock('@/src/features/exam/examPreference', () => ({
  writeExamPreference: (...args: unknown[]) => mockWriteExamPreference(...args),
}));

jest.mock('@/src/lib/auth', () => ({
  ensureSignedIn: () => mockEnsureSignedIn(),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: () => mockCallable,
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({ functions: {}, db: {} }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

import { submitOnboarding } from '@/src/features/onboarding/completeClient';

describe('submitOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCallable.mockRejectedValue(new Error('CLOUD_BLOCKED'));
  });

  it('writes local profile, unlocks gate, and does not fail when cloud sync fails', async () => {
    const events: string[] = [];
    const unsub = jest.requireActual('@/src/features/onboarding/onboardingReplay')
      .subscribeOnboardingGate((ev: { type: string }) => {
        events.push(ev.type);
      });

    await submitOnboarding({
      examType: 'ygs',
      ageBand: '18plus',
      parentalConsent: false,
    });

    expect(mockWriteExamPreference).toHaveBeenCalledWith('ygs');
    expect(mockCompleteOnboardingLocal).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ examType: 'ygs' }),
    );
    expect(events).toContain('complete');
    unsub();
  });
});

describe('markOnboardingComplete', () => {
  it('still emits complete event', () => {
    const events: string[] = [];
    const { subscribeOnboardingGate } = jest.requireActual(
      '@/src/features/onboarding/onboardingReplay',
    );
    const unsub = subscribeOnboardingGate((ev: { type: string }) => events.push(ev.type));
    markOnboardingComplete();
    expect(events).toEqual(['complete']);
    unsub();
  });
});
