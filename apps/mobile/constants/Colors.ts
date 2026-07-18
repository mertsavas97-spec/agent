import { colors } from '@/src/theme';

/** Bridge template Colors → moodboard tokens (light-first; product UI is light). */
export default {
  light: {
    text: colors.textPrimary,
    background: colors.surface,
    tint: colors.navy,
    tabIconDefault: '#94A3B8',
    tabIconSelected: colors.orange,
  },
  dark: {
    text: colors.white,
    background: colors.navy,
    tint: colors.orange,
    tabIconDefault: '#64748B',
    tabIconSelected: colors.orange,
  },
};
