import { usePathname, useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fetchOnboardingStatus } from '@/src/features/onboarding/completeClient';
import { ensureSignedIn, subscribeAuth } from '@/src/lib/auth';
import { colors, space } from '@/src/theme';

type GateState =
  | { status: 'loading' }
  | { status: 'needs_onboarding' }
  | { status: 'ready' };

const BOOT_TIMEOUT_MS = 12_000;

/**
 * Auth/onboarding gate. Always keeps the Stack mounted after boot —
 * never replace the navigator tree with <Redirect> (expo-router update loop).
 */
export function BootstrapGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [uid, setUid] = useState<string | null>(null);
  const [state, setState] = useState<GateState>({ status: 'loading' });
  const [bootError, setBootError] = useState<string | null>(null);
  const bootedForUid = useRef<string | null>(null);
  const navigatingRef = useRef(false);

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
      } catch (err) {
        if (!alive) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-boot on auth uid
  }, [uid]);

  // Imperative navigation — keep Stack mounted (avoids Redirect update-depth loop)
  useEffect(() => {
    if (state.status === 'loading') return;
    if (navigatingRef.current) return;

    const onOnboarding = pathname.includes('onboarding');

    if (state.status === 'needs_onboarding' && !onOnboarding) {
      // Might have just finished onboarding — re-check before bouncing back
      let alive = true;
      void (async () => {
        try {
          const status = await fetchOnboardingStatus();
          if (!alive) return;
          if (status.done) {
            if (uid) bootedForUid.current = uid;
            setState({ status: 'ready' });
            return;
          }
        } catch {
          /* fall through to onboarding */
        }
        if (!alive) return;
        navigatingRef.current = true;
        routerRef.current.replace('/onboarding');
        requestAnimationFrame(() => {
          navigatingRef.current = false;
        });
      })();
      return () => {
        alive = false;
      };
    }

    if (state.status === 'ready' && onOnboarding) {
      navigatingRef.current = true;
      routerRef.current.replace('/(tabs)');
      requestAnimationFrame(() => {
        navigatingRef.current = false;
      });
    }
    // router omitted from deps — unstable identity would re-fire navigation every render
  }, [state.status, pathname, uid]);

  if (state.status === 'loading') {
    return (
      <View style={styles.center} testID="bootstrap-loading">
        <View style={styles.robotMini}>
          <View style={styles.eyeRow}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
          <View style={styles.mouth} />
        </View>
        <Text style={styles.hint}>Hazırlanıyor…</Text>
      </View>
    );
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
  robotMini: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  eye: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white },
  mouth: { width: 22, height: 5, borderRadius: 3, backgroundColor: colors.orange },
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
  },
  bannerText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
