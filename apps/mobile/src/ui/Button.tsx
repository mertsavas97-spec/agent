import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  colors,
  interaction,
  radii,
  shadows,
  space,
  typography,
} from '@/src/theme';
import { hapticLight, hapticMedium } from '@/src/ui/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onDark';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  haptic?: 'none' | 'light' | 'medium';
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  left?: ReactNode;
};

/**
 * Premium CTA primitive — press opacity + optional haptic on every primary action.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  haptic = 'light',
  testID,
  accessibilityLabel,
  style,
  labelStyle,
  left,
}: ButtonProps) {
  const blocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      testID={testID}
      onPress={() => {
        if (blocked) return;
        if (haptic === 'light') void hapticLight();
        if (haptic === 'medium') void hapticMedium();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        variant === 'primary' ? shadows.cta : null,
        pressed && !blocked ? { opacity: interaction.pressedOpacity } : null,
        blocked ? { opacity: interaction.disabledOpacity } : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary' || variant === 'ghost'
              ? colors.navy
              : colors.white
          }
        />
      ) : (
        <>
          {left}
          <Text style={[styles.label, labelVariantStyles[variant], sizeLabelStyles[size], labelStyle]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: interaction.minTouch,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  label: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 40,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  md: {
    minHeight: interaction.minTouch,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});

const sizeLabelStyles = StyleSheet.create({
  sm: { fontSize: typography.size.sm },
  md: { fontSize: typography.size.md },
  lg: { fontSize: typography.size.lg },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.orange,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  onDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});

const labelVariantStyles = StyleSheet.create({
  primary: { color: colors.navy },
  secondary: { color: colors.navy },
  ghost: { color: colors.navy },
  danger: { color: colors.white },
  onDark: { color: colors.white },
});
