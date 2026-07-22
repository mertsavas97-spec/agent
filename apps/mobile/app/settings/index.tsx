import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';
import { readExamPreference } from '@/src/features/exam/examPreference';
import { isExamType } from '@/src/features/exam/examTypes';
import {
  loadEntitlementSnapshot,
  useExamModeChange,
} from '@/src/features/exam/useExamModeChange';
import {
  LEGAL_DOCS,
  type LegalDocId,
} from '@/src/features/legal/legalCopy';
import { replayOnboardingForDemo } from '@/src/features/onboarding/completeClient';
import {
  hydrateDemoForceFree,
  isDemoForceFree,
  isDemoPlanToolsAllowed,
  setDemoForceFree,
} from '@/src/features/paywall/demoForceFree';
import {
  hydrateEntitlement,
  isPremiumActive,
  type EntitlementSnapshot,
} from '@/src/features/paywall/entitlement';
import {
  loadPushPrefs,
  PUSH_CATEGORIES,
  setPushCategory,
  type PushPrefs,
} from '@/src/features/push/pushPrefs';
import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { TR_EYEBROW } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { CozbilRobot } from '@/src/ui/CozbilRobot';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { hapticLight, hapticMedium } from '@/src/ui/haptics';
import { PressableSurface } from '@/src/ui/PressableSurface';

export default function SettingsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<PushPrefs | null>(null);
  const [ent, setEnt] = useState<EntitlementSnapshot | null>(null);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [forceFree, setForceFree] = useState(false);
  const [planSwitching, setPlanSwitching] = useState(false);
  const { requestExamChange } = useExamModeChange({
    ent,
    onOptimistic: (next) => setExamType(next),
  });

  useEffect(() => {
    void (async () => {
      setPrefs(await loadPushPrefs());
      const forced = await hydrateDemoForceFree();
      setForceFree(forced);
      setEnt(await loadEntitlementSnapshot());
      try {
        const user = await ensureSignedIn();
        const { db } = getFirebase();
        const [preferred, snap] = await Promise.all([
          readExamPreference(),
          getDoc(doc(db, 'users', user.uid)),
        ]);
        const et = snap.data()?.examType;
        if (preferred) setExamType(preferred);
        else if (isExamType(et)) setExamType(et);
      } catch {
        /* keep null */
      }
    })();
  }, []);

  async function toggle(id: keyof PushPrefs, value: boolean) {
    void hapticLight();
    if (id === 'master') {
      setPrefs(await setPushCategory('master', value));
      return;
    }
    setPrefs(await setPushCategory(id, value));
  }

  function onReplayOnboarding() {
    Alert.alert(
      'Onboarding’i yeniden yükle',
      'Demo için onboarding baştan açılır. Onay ve tamamlanma kaydı temizlenir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Yeniden yükle',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setReplaying(true);
              try {
                await replayOnboardingForDemo();
              } catch {
                Alert.alert(
                  'Yeniden yüklenemedi',
                  'Bağlantını kontrol edip tekrar dene.',
                );
                setReplaying(false);
              }
            })();
          },
        },
      ],
    );
  }

  function onToggleDemoPlan() {
    const nextForceFree = !forceFree;
    Alert.alert(
      nextForceFree ? 'Ücretsiz plana geç (demo)' : 'Premium’a dön (demo)',
      nextForceFree
        ? 'Yalnızca bu geliştirme derlemesinde. Premium kaydı silinmez; free kota, banner ve reklam kapılarını denemek için kullanılır.'
        : 'Demo free override kapanır. Daha önce aktif Premium varsa geri gelir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: nextForceFree ? 'Free’ye geç' : 'Premium’a dön',
          onPress: () => {
            void (async () => {
              setPlanSwitching(true);
              try {
                void hapticMedium();
                await setDemoForceFree(nextForceFree);
                setForceFree(isDemoForceFree());
                setEnt(await hydrateEntitlement());
              } finally {
                setPlanSwitching(false);
              }
            })();
          },
        },
      ],
    );
  }

  const premium = isPremiumActive(ent ?? undefined);
  const demoTools = isDemoPlanToolsAllowed();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      testID="settings-screen">
      <Stack.Screen
        options={{
          title: 'Ayarlar',
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.brandRow} testID="settings-brand">
        <CozbilRobot size={36} animate={false} tone="onLight" testID="settings-brand-icon" />
        <View style={{ flex: 1 }}>
          <Eyebrow>{TR_EYEBROW.settings}</Eyebrow>
          <Text style={styles.title}>Ayarlar</Text>
        </View>
      </View>
      <Text style={styles.sub}>
        Sınav paketi, bildirimler, Premium ve hukuki metinler.
      </Text>

      <View style={styles.card} testID="settings-exam">
        <Eyebrow tone="navy">{TR_EYEBROW.modPicker}</Eyebrow>
        <Text style={styles.cardTitle}>Sınav paketi</Text>
        <Text style={styles.cardBody}>
          Aktif paketi istediğin zaman değiştir. Çözüm dili ve konu kataloğu buna göre
          ayarlanır.
        </Text>
        <ExamModeSwitcher
          value={examType}
          onChange={(next) => requestExamChange(examType, next)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Premium</Text>
        <Text style={styles.cardBody}>
          {premium
            ? 'Premium aktif · reklamsız ve sınırsız çözüm'
            : 'Ücretsiz plan · günlük hak sınırlı'}
        </Text>
        <Button
          testID="settings-premium-cta"
          label={premium ? 'Planı yönet' : 'Premium’a geç'}
          onPress={() => router.push('/premium')}
        />
      </View>

      <View style={styles.card} testID="settings-push">
        <Eyebrow tone="navy">{TR_EYEBROW.push}</Eyebrow>
        <Text style={styles.cardTitle}>Bildirimler</Text>
        <View style={styles.honestyBanner} testID="settings-push-honesty">
          <Text style={styles.honestyTitle}>Gönderim henüz yok</Text>
          <Text style={styles.honestyBody}>
            Tercihler cihazda saklanır. FCM/APNs bağlı değil — bildirim gelmez;
            aç/kapa yalnızca ilerideki gönderim için hazırlık.
          </Text>
        </View>
        {prefs ? (
          <>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Tüm bildirimler</Text>
              <Switch
                testID="push-master"
                value={prefs.master}
                onValueChange={(v) => void toggle('master', v)}
                trackColor={{ true: colors.orange, false: colors.border }}
              />
            </View>
            {PUSH_CATEGORIES.map((c) => (
              <View key={c.id} style={styles.row}>
                <View style={{ flex: 1, paddingRight: space.sm }}>
                  <Text style={styles.rowLabel}>{c.title}</Text>
                  <Text style={styles.rowHint}>{c.description}</Text>
                </View>
                <Switch
                  testID={`push-${c.id}`}
                  disabled={!prefs.master}
                  value={prefs.master && prefs[c.id]}
                  onValueChange={(v) => void toggle(c.id, v)}
                  trackColor={{ true: colors.orange, false: colors.border }}
                />
              </View>
            ))}
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Eyebrow tone="navy">{TR_EYEBROW.legal}</Eyebrow>
        <Text style={styles.cardTitle}>Hukuki</Text>
        {(Object.keys(LEGAL_DOCS) as LegalDocId[]).map((id) => (
          <PressableSurface
            key={id}
            testID={`settings-legal-${id}`}
            style={styles.linkRow}
            onPress={() =>
              router.push({ pathname: '/settings/legal/[id]', params: { id } })
            }>
            <Text style={styles.linkLabel}>{LEGAL_DOCS[id].title}</Text>
            <Text style={styles.chevron}>›</Text>
          </PressableSurface>
        ))}
      </View>

      {demoTools ? (
        <View style={styles.card} testID="settings-demo">
          <Text style={styles.demoKicker}>DEMO · KİŞİSEL CİHAZ</Text>
          <Text style={styles.cardTitle}>Plan denemesi</Text>
          <Text style={styles.cardBody} testID="settings-demo-plan-status">
            {forceFree
              ? 'Demo free açık · Premium kaydı saklı. Kota, banner ve reklam kapıları free gibi.'
              : premium
                ? 'Premium aktif. Free deneyimi için aşağıdaki düğmeyi kullan.'
                : 'Zaten free görünüyorsun. Premium denemek için üstteki Premium kartını kullan.'}
          </Text>
          <Button
            testID="settings-demo-force-free"
            label={forceFree ? 'Premium’a dön (demo)' : 'Ücretsiz plana geç (demo)'}
            variant="secondary"
            loading={planSwitching}
            disabled={planSwitching}
            onPress={onToggleDemoPlan}
            style={{ marginBottom: space.sm }}
          />
          <Text style={styles.cardTitle}>Onboarding</Text>
          <Text style={styles.cardBody}>
            Yalnızca geliştirme derlemesinde. Onboarding akışını baştan gösterir.
          </Text>
          <Button
            testID="settings-replay-onboarding"
            label="Onboarding’i yeniden yükle"
            variant="secondary"
            loading={replaying}
            disabled={replaying}
            onPress={onReplayOnboarding}
          />
        </View>
      ) : null}

      <Text style={styles.version} testID="settings-version">
        ÇözBil · sürüm 1.0.0 (MVP)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 0,
  },
  sub: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  cardTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  cardBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: space.md,
  },
  honestyBanner: {
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.orange,
    padding: space.sm,
    marginBottom: space.md,
  },
  honestyTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  honestyBody: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    color: colors.navy,
  },
  rowHint: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  linkLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 15,
    color: colors.navy,
  },
  chevron: { fontSize: 22, color: colors.navy },
  demoKicker: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.orange,
    marginBottom: 6,
  },
  version: {
    marginTop: space.md,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
});
