import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { runRewardedExamSwitch } from '@/src/features/ads';
import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { readExamPreference } from '@/src/features/exam/examPreference';
import { isExamType } from '@/src/features/exam/examTypes';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import {
  LEGAL_DOCS,
  type LegalDocId,
} from '@/src/features/legal/legalCopy';
import { replayOnboardingForDemo } from '@/src/features/onboarding/completeClient';
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
import { colors, radii, space, typography } from '@/src/theme';
import { Eyebrow } from '@/src/ui/Eyebrow';

export default function SettingsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<PushPrefs | null>(null);
  const [ent, setEnt] = useState<EntitlementSnapshot | null>(null);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [switching, setSwitching] = useState(false);
  const [replaying, setReplaying] = useState(false);

  useEffect(() => {
    void (async () => {
      setPrefs(await loadPushPrefs());
      setEnt(await hydrateEntitlement());
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
    if (id === 'master') {
      setPrefs(await setPushCategory('master', value));
      return;
    }
    setPrefs(await setPushCategory(id, value));
  }

  function onExamChange(next: ExamType) {
    if (next === examType || switching) return;
    const premium = isPremiumActive(ent ?? undefined);
    const label = EXAM_LABEL[next];

    if (premium) {
      void applyExam(next);
      return;
    }

    Alert.alert(
      'Mod değiştir',
      `${label} paketine geçmek için bir reklam izlemen gerekir.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reklam izle ve geç',
          onPress: () => {
            void (async () => {
              setSwitching(true);
              try {
                const unlock = await runRewardedExamSwitch();
                if (!unlock.allowed) {
                  Alert.alert(
                    'Devam edilmedi',
                    'Reklam tamamlanmadan sınav paketi değiştirilemez.',
                  );
                  return;
                }
                await callUpdateExamType(next);
                setExamType(next);
              } catch {
                Alert.alert('Sınav değiştirilemedi', 'Bağlantını kontrol edip tekrar dene.');
              } finally {
                setSwitching(false);
              }
            })();
          },
        },
      ],
    );
  }

  async function applyExam(next: ExamType) {
    setSwitching(true);
    try {
      await callUpdateExamType(next);
      setExamType(next);
    } catch {
      Alert.alert('Sınav değiştirilemedi', 'Bağlantını kontrol edip tekrar dene.');
    } finally {
      setSwitching(false);
    }
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

  const premium = isPremiumActive(ent ?? undefined);

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

      <Eyebrow>{TR_EYEBROW.settings}</Eyebrow>
      <Text style={styles.title}>Ayarlar</Text>
      <Text style={styles.sub}>
        Sınav paketi, bildirimler, Premium ve hukuki metinler.
      </Text>

      <View style={styles.card} testID="settings-exam">
        <Eyebrow tone="navy">{TR_EYEBROW.modPicker}</Eyebrow>
        <Text style={styles.cardTitle}>Sınav paketi</Text>
        <Text style={styles.cardBody}>
          {premium
            ? 'Premium: paketi reklamsız değiştirebilirsin.'
            : 'Her paket değişiminde bir reklam izlemen gerekir.'}
        </Text>
        <ExamModeSwitcher
          value={examType}
          onChange={onExamChange}
          disabled={switching}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Premium</Text>
        <Text style={styles.cardBody}>
          {premium
            ? 'Premium aktif · reklamsız ve sınırsız çözüm'
            : 'Ücretsiz plan · günlük hak sınırlı'}
        </Text>
        <Pressable
          testID="settings-premium-cta"
          style={styles.primaryBtn}
          onPress={() => router.push('/premium')}>
          <Text style={styles.primaryLabel}>
            {premium ? 'Planı yönet' : 'Premium’a geç'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card} testID="settings-push">
        <Eyebrow tone="navy">{TR_EYEBROW.push}</Eyebrow>
        <Text style={styles.cardTitle}>Bildirimler</Text>
        <Text style={styles.cardBody}>
          Tercihler cihazda saklanır. Sistem izni istendiğinde OS ayarları da gerekir.
        </Text>
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
          <Pressable
            key={id}
            testID={`settings-legal-${id}`}
            style={styles.linkRow}
            onPress={() =>
              router.push({ pathname: '/settings/legal/[id]', params: { id } })
            }>
            <Text style={styles.linkLabel}>{LEGAL_DOCS[id].title}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card} testID="settings-demo">
        <Text style={styles.demoKicker}>DEMO · KİŞİSEL CİHAZ</Text>
        <Text style={styles.cardTitle}>Onboarding</Text>
        <Text style={styles.cardBody}>
          Şimdilik yalnızca demo için. Onboarding akışını baştan gösterir.
        </Text>
        <Pressable
          testID="settings-replay-onboarding"
          style={[styles.demoBtn, replaying && styles.demoBtnDisabled]}
          disabled={replaying}
          onPress={onReplayOnboarding}>
          {replaying ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <Text style={styles.demoBtnLabel}>Onboarding’i yeniden yükle</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.version} testID="settings-version">
        ÇözBil · sürüm 1.0.0 (MVP)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
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
  primaryBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.navy,
    fontSize: 15,
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
  demoBtn: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.navySoft,
  },
  demoBtnDisabled: { opacity: 0.6 },
  demoBtnLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.navy,
    fontSize: 15,
  },
  version: {
    marginTop: space.md,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
});
