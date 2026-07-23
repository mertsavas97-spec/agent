import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { LEGAL_DOCS, type LegalDocId } from '@/src/features/legal/legalCopy';
import {
  privacyPolicyUrl,
  supportEmail,
  termsUrl,
} from '@/src/features/legal/legalUrls';
import { colors, radii, space, typography } from '@/src/theme';

function isLegalId(v: string): v is LegalDocId {
  return v === 'privacy' || v === 'terms' || v === 'kvkk';
}

export default function LegalDocScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && isLegalId(params.id) ? params.id : 'privacy';
  const doc = LEGAL_DOCS[id];
  const publicUrl =
    id === 'privacy' || id === 'kvkk'
      ? privacyPolicyUrl()
      : id === 'terms'
        ? termsUrl()
        : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      testID={`legal-doc-${id}`}>
      <Stack.Screen
        options={{
          title: doc.title,
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: '#fff',
        }}
      />
      <Text style={styles.title}>{doc.title}</Text>
      <Text style={styles.updated}>Güncelleme: {doc.updated}</Text>
      {doc.sections.map((s) => (
        <Text key={s.heading} style={styles.block}>
          <Text style={styles.heading}>{s.heading}{'\n'}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </Text>
      ))}
      <Text style={styles.support}>Destek: {supportEmail()}</Text>
      {publicUrl ? (
        <Pressable
          testID="legal-open-public-url"
          style={styles.linkBtn}
          onPress={() => void Linking.openURL(publicUrl)}>
          <Text style={styles.linkLabel}>Tam metni tarayıcıda aç</Text>
        </Pressable>
      ) : id === 'privacy' || id === 'kvkk' ? (
        <Text style={styles.hint} testID="legal-url-missing-hint">
          Genel HTTPS gizlilik URL’si henüz bağlanmadı. Hosting sonrası
          EXPO_PUBLIC_PRIVACY_POLICY_URL ile yayınlanır (bkz. docs/legal/).
        </Text>
      ) : id === 'terms' ? (
        <Text style={styles.hint} testID="legal-url-missing-hint">
          Genel HTTPS kullanım koşulları URL’si henüz bağlanmadı. Hosting sonrası
          EXPO_PUBLIC_TERMS_URL ile yayınlanır (bkz. hosting/public/terms/).
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  updated: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: space.lg,
  },
  block: { marginBottom: space.lg },
  heading: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  body: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  support: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: space.md,
  },
  linkBtn: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.white,
    fontWeight: '700',
  },
  hint: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
});
