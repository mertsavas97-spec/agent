/**
 * Auth/onboarding gate. Keeps the Stack mounted but covers it until the
 * destination route is ready — avoids a one-frame home flash before onboarding.
 */
import { usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fetchOnboardingStatus } from '@/src/features/onboarding/completeClient';
import { subscribeOnboardingGate } from '@/src/features/onboarding/onboardingReplay';
import { hydrateEntitlement } from '@/src/features/paywall/entitlement';
import { ensureSignedIn, subscribeAuth } from '@/src/lib/auth';
import { colors, space } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';

type GateState =
  | { status: 'loading' }
  | { status: 'needs_onboarding' }
  | { status: 'ready' };

const BOOT_TIMEOUT_MS = 12_000;

function pathIsOnboarding(pathname: string): boolean {
  return pathname.includes('onboarding');
}

export function BootstrapGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [uid, setUid] = useState<string | null>(null);
  const [state, setState] = useState<GateState>({ status: 'loading' });
  const [bootError, setBootError] = useState<string | null>(null);
  const [replayToken, setReplayToken] = useState(0);
  const bootedForUid = useRef<string | null>(null);
  const navigatingRef = useRef(false);
  const bootGenRef = useRef(0);

  const onOnboarding = pathIsOnboarding(pathname);
  /** Cover the stack until we know where to go / until onboarding is on screen. */
  const blocking =
    state.status === 'loading' ||
    (state.status === 'needs_onboarding' && !onOnboarding);

  useEffect(() => {
    return subscribeOnboardingGate((event) => {
      if (event.type === 'complete') {
        bootGenRef.current += 1;
        if (uid) bootedForUid.current = uid;
        setBootError(null);
        setState({ status: 'ready' });
        return;
      }
      bootedForUid.current = null;
      setReplayToken((n) => n + 1);
    });
  }, [uid]);

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
    if (uid && bootedForUid.current === uid && state.status !== 'loading') {
      return;
    }

    let alive = true;
    const bootGen = ++bootGenRef.current;
    setState({ status: 'loading' });
    setBootError(null);

    const timer = setTimeout(() => {
      if (!alive || bootGen !== bootGenRef.current) return;
      setBootError('Bağlantı zaman aşımı — uygulama sınırlı açılıyor.');
      setState({ status: 'ready' });
    }, BOOT_TIMEOUT_MS);

    void (async () => {
      try {
        const [status] = await Promise.all([
          fetchOnboardingStatus(),
          hydrateEntitlement().catch(() => null),
        ]);
        if (!alive || bootGen !== bootGenRef.current) return;
        clearTimeout(timer);
        if (uid) bootedForUid.current = uid;
        setState(
          status.done ? { status: 'ready' } : { status: 'needs_onboarding' },
        );
      } catch (err) {
        if (!alive || bootGen !== bootGenRef.current) return;
        clearTimeout(timer);
        const msg = err instanceof Error ? err.message : '';
        setBootError(
          msg.includes('AUTH')
            ? 'Giriş yapılamadı — Anonymous Auth / internet kontrol et.'
            : 'Profil yüklenemedi — internet veya Firestore kurallarını kontrol et.',
        );
        setState({ status: 'ready' });
      }
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot on uid or demo replay
  }, [uid, replayToken]);

  useEffect(() => {
    if (state.status === 'loading') return;
    if (navigatingRef.current) return;

    if (state.status === 'needs_onboarding' && !onOnboarding) {
      navigatingRef.current = true;
      routerRef.current.replace('/onboarding');
      requestAnimationFrame(() => {
        navigatingRef.current = false;
      });
      return;
    }

    if (state.status === 'ready' && onOnboarding) {
      navigatingRef.current = true;
      routerRef.current.replace('/(tabs)');
      requestAnimationFrame(() => {
        navigatingRef.current = false;
      });
    }
  }, [state.status, onOnboarding]);

  useEffect(() => {
    if (!blocking) {
      void SplashScreen.hideAsync();
    }
  }, [blocking]);

  return (
    <>
      {bootError && !blocking ? (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>{bootError}</Text>
        </View>
      ) : null}
      {children}
      {blocking ? (
        <View style={styles.blocker} testID="bootstrap-loading">
          <CozbilRobot size={72} animate tone="onLight" testID="bootstrap-robot" />
          <Text style={styles.hint}>Hazırlanıyor…</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  blocker: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    gap: space.md,
    zIndex: 100,
    elevation: 100,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  banner: {
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    zIndex: 50,
  },
  bannerText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
