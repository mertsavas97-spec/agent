import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';

export type EmptyStateProps = {
  title: string;
  subtitle?: string;
  testID?: string;
};

/** Soft empty panel — no decorative card chrome beyond surface contrast. */
export function EmptyState({ title, subtitle, testID }: EmptyStateProps) {
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.glyphDisk}>
        <View style={styles.glyphInner} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
  },
  glyphDisk: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  glyphInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.orange,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontWeight: '600',
    fontSize: 16,
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 18,
  },
});
