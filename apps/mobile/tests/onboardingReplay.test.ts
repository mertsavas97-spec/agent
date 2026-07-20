import {
  markOnboardingComplete,
  requestOnboardingReplay,
  subscribeOnboardingGate,
} from '@/src/features/onboarding/onboardingReplay';

describe('onboardingGate bus', () => {
  it('notifies complete and replay separately', () => {
    const events: string[] = [];
    const unsub = subscribeOnboardingGate((ev) => {
      events.push(ev.type);
    });
    markOnboardingComplete();
    requestOnboardingReplay();
    expect(events).toEqual(['complete', 'replay']);
    unsub();
    markOnboardingComplete();
    expect(events).toEqual(['complete', 'replay']);
  });
});
