import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';
import { Button } from '@/src/ui/Button';

export type EmptyStateProps = {
  title: string;
  subtitle?: string;
  testID?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTestID?: string;
  glyph?: ReactNode;
};

/** Soft empty panel — optional CTA for recoverable empties. */
export function EmptyState({
  title,
  subtitle,
  testID,
  actionLabel,
  onAction,
  actionTestID,
  glyph,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.glyphDisk}>
        {glyph ?? <View style={styles.glyphInner} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          size="sm"
          style={styles.action}
          testID={actionTestID}
        />
      ) : null}
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
    borderRadius: radii.pill,
    backgroundColor: colors.orange,
  },
  title: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '600',
    fontSize: typography.size.md,
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 18,
  },
  action: {
    marginTop: space.md,
    alignSelf: 'center',
  },
});
