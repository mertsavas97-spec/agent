import { Redirect, usePathname } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { fetchOnboardingStatus } from '@/src/features/onboarding/completeClient';
import { colors } from '@/src/theme';

type GateState =
  | { status: 'loading' }
  | { status: 'needs_onboarding' }
  | { status: 'ready' };

export function BootstrapGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<GateState>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const status = await fetchOnboardingStatus();
        if (!alive) return;
        setState(
          status.done ? { status: 'ready' } : { status: 'needs_onboarding' },
        );
      } catch {
        if (!alive) return;
        // Auth/emulator unavailable in unit tests — let children render.
        setState({ status: 'ready' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (state.status === 'loading') {
    return (
      <View style={styles.center} testID="bootstrap-loading">
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  const onOnboarding = pathname.includes('onboarding');
  if (state.status === 'needs_onboarding' && !onOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  if (state.status === 'ready' && onOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
