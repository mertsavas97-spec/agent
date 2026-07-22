import type { ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { interaction } from '@/src/theme';
import { hapticLight, hapticMedium, hapticSelection } from '@/src/ui/haptics';

export type PressableSurfaceProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  haptic?: 'none' | 'light' | 'medium' | 'selection';
  children?: ReactNode;
};

/** Tokenized press wrapper for rows/chips/CTAs that are not full Buttons. */
export function PressableSurface({
  style,
  haptic = 'selection',
  onPress,
  disabled,
  children,
  ...rest
}: PressableSurfaceProps) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={(e) => {
        if (disabled) return;
        if (haptic === 'light') void hapticLight();
        if (haptic === 'medium') void hapticMedium();
        if (haptic === 'selection') void hapticSelection();
        onPress?.(e);
      }}
      style={(state) => {
        const resolved = typeof style === 'function' ? style(state) : style;
        return [
          resolved,
          state.pressed && !disabled ? { opacity: interaction.pressedOpacity } : null,
          disabled ? { opacity: interaction.disabledOpacity } : null,
        ];
      }}>
      {children}
    </Pressable>
  );
}
