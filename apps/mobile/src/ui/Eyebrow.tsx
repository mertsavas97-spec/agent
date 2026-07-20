import { StyleSheet, Text, type TextProps, type StyleProp, type TextStyle } from 'react-native';

import { colors, typography } from '@/src/theme';

type Props = TextProps & {
  children: string;
  style?: StyleProp<TextStyle>;
  tone?: 'navy' | 'orange' | 'muted' | 'theme';
  color?: string;
};

/**
 * Small caps-style eyebrow that already receives TR-correct uppercase strings
 * (use `trUpper` / `TR_EYEBROW`). Does NOT apply CSS textTransform.
 */
export function Eyebrow({ children, style, tone = 'orange', color, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        tone === 'navy' && styles.navy,
        tone === 'orange' && styles.orange,
        tone === 'muted' && styles.muted,
        color ? { color } : null,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  navy: { color: colors.navy },
  orange: { color: colors.orange },
  muted: { color: colors.textMuted },
});
