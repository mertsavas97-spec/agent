import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { LEGAL_DOCS, type LegalDocId } from '@/src/features/legal/legalCopy';
import { colors, space, typography } from '@/src/theme';

function isLegalId(v: string): v is LegalDocId {
  return v === 'privacy' || v === 'terms' || v === 'kvkk';
}

export default function LegalDocScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && isLegalId(params.id) ? params.id : 'privacy';
  const doc = LEGAL_DOCS[id];

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
});
