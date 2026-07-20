import {
  requestOnboardingReplay,
  subscribeOnboardingReplay,
} from '@/src/features/onboarding/onboardingReplay';

describe('onboardingReplay bus', () => {
  it('notifies subscribers when demo replay is requested', () => {
    const fn = jest.fn();
    const unsub = subscribeOnboardingReplay(fn);
    requestOnboardingReplay();
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    requestOnboardingReplay();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
