/**
 * ÇözBil design tokens — source: docs/design/moodboard/
 * Scale refined via ui-design-system (modern) on navy #1E1B4B.
 */
export const colors = {
  navy: '#1E1B4B',
  navySoft: '#EEF0F7',
  orange: '#F59E0B',
  orangeSoft: '#FFF7E6',
  white: '#FFFFFF',
  surface: '#F5F6FA',
  textPrimary: '#1E1B4B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  danger: '#DC2626',
  success: '#16A34A',
} as const;

export const typography = {
  fontFamily: 'Poppins',
  headingWeight: '600' as const,
  bodyWeight: '400' as const,
  captionWeight: '500' as const,
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
} as const;

export const shadows = {
  soft: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cta: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

export const brand = {
  name: 'ÇözBil',
  exams: ['lgs', 'ygs', 'kpss'] as const,
};
