/**
 * BootstrapGate bus — onboarding complete / demo replay.
 */
export type OnboardingGateEvent = { type: 'complete' } | { type: 'replay' };

type Listener = (event: OnboardingGateEvent) => void;

const listeners = new Set<Listener>();

export function subscribeOnboardingGate(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** After successful submitOnboarding — gate must become ready immediately. */
export function markOnboardingComplete(): void {
  for (const listener of listeners) {
    listener({ type: 'complete' });
  }
}

/** Demo Settings: clear flags then re-boot into onboarding. */
export function requestOnboardingReplay(): void {
  for (const listener of listeners) {
    listener({ type: 'replay' });
  }
}

/** @deprecated use subscribeOnboardingGate */
export function subscribeOnboardingReplay(listener: () => void): () => void {
  return subscribeOnboardingGate((ev) => {
    if (ev.type === 'replay') listener();
  });
}
