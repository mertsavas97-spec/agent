/**
 * ÇözBil design tokens — source: docs/design/moodboard/ + DESIGN.md
 * Scale refined via ui-design-system (modern) on navy #1E1B4B.
 */
export const colors = {
  navy: '#1E1B4B',
  navySoft: '#EEF0F7',
  navyDeep: '#0F0C30',
  orange: '#F59E0B',
  orangeSoft: '#FFF7E6',
  orangeMuted: 'rgba(245, 158, 11, 0.16)',
  white: '#FFFFFF',
  surface: '#F5F6FA',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1E1B4B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(226, 232, 240, 0.82)',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  track: '#F1F5F9',
  scrim: 'rgba(30, 27, 75, 0.45)',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
} as const;

export const typography = {
  fontFamily: 'Poppins',
  fontFamilyMedium: 'Poppins-Medium',
  fontFamilySemiBold: 'Poppins-SemiBold',
  fontFamilyBold: 'Poppins-Bold',
  headingWeight: '600' as const,
  bodyWeight: '400' as const,
  captionWeight: '500' as const,
  /** Typed scale — prefer these over raw fontSize. */
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 28,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    body: 1.5,
  },
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
  camera: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  cta: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

/** Press / disabled interaction. */
export const interaction = {
  pressedOpacity: 0.88,
  disabledOpacity: 0.45,
  minTouch: 48,
} as const;

/** Motion budgets — AnalyzingView / robot / sheets. */
export const motion = {
  fast: 180,
  normal: 280,
  slow: 480,
  crawl: 42_000,
  orbit: 7200,
  tip: 4200,
  easing: {
    out: 'ease-out' as const,
    inOut: 'ease-in-out' as const,
  },
} as const;

export const brand = {
  name: 'ÇözBil',
  exams: ['lgs', 'ygs', 'kpss', 'trafik'] as const,
};

/** Shared navy stack header — use instead of copy-pasting #fff. */
export function screenHeaderOptions(title?: string) {
  return {
    ...(title ? { title } : {}),
    headerBackTitle: 'Geri',
    headerStyle: { backgroundColor: colors.navy },
    headerTintColor: colors.white,
    headerTitleStyle: {
      fontFamily: typography.fontFamilySemiBold,
      color: colors.white,
    },
  } as const;
}
