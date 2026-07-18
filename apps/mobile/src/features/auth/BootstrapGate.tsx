import { Redirect, usePathname } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fetchOnboardingStatus } from '@/src/features/onboarding/completeClient';
import { ensureSignedIn, subscribeAuth } from '@/src/lib/auth';
import { colors, space } from '@/src/theme';

type GateState =
  | { status: 'loading' }
  | { status: 'needs_onboarding' }
  | { status: 'ready' };

const BOOT_TIMEOUT_MS = 12_000;

export function BootstrapGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [uid, setUid] = useState<string | null>(null);
  const [state, setState] = useState<GateState>({ status: 'loading' });
  const [bootError, setBootError] = useState<string | null>(null);
  const bootedForUid = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
      setState({ status: 'ready' });
      return;
    }
    const unsub = subscribeAuth((user) => {
      setUid(user?.uid ?? null);
      if (!user) {
        void ensureSignedIn().catch(() => {
          setBootError('Giriş yapılamadı. İnternet / Anonymous Auth açık mı?');
          setState({ status: 'ready' });
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
      setState({ status: 'ready' });
      return;
    }
    // Avoid remounting spinner on every tab pathname change.
    if (uid && bootedForUid.current === uid && state.status !== 'loading') {
      return;
    }

    let alive = true;
    setState({ status: 'loading' });
    setBootError(null);

    const timer = setTimeout(() => {
      if (!alive) return;
      setBootError('Bağlantı zaman aşımı — uygulama sınırlı açılıyor.');
      setState({ status: 'ready' });
    }, BOOT_TIMEOUT_MS);

    void (async () => {
      try {
        const status = await fetchOnboardingStatus();
        if (!alive) return;
        clearTimeout(timer);
        if (uid) bootedForUid.current = uid;
        setState(
          status.done ? { status: 'ready' } : { status: 'needs_onboarding' },
        );
      } catch {
        if (!alive) return;
        clearTimeout(timer);
        setBootError('Sunucuya ulaşılamadı — offline / demo mod.');
        setState({ status: 'ready' });
      }
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-boot on auth uid
  }, [uid]);

  if (state.status === 'loading') {
    return (
      <View style={styles.center} testID="bootstrap-loading">
        <ActivityIndicator color={colors.navy} size="large" />
        <Text style={styles.hint}>Hazırlanıyor…</Text>
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

  return (
    <>
      {bootError ? (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>{bootError}</Text>
        </View>
      ) : null}
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    gap: space.md,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  bannerText: {
    color: '#92400E',
    fontSize: 12,
    textAlign: 'center',
  },
});
