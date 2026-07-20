/**
 * Demo-only bus: Settings “Onboarding’i yeniden yükle” → BootstrapGate re-boots.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeOnboardingReplay(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Ask BootstrapGate to re-fetch onboarding status and route accordingly. */
export function requestOnboardingReplay(): void {
  for (const listener of listeners) {
    listener();
  }
}
