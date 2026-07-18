/**
 * ÇözBil design tokens — source: docs/design/moodboard/
 * ui-ux-pro-max CLI unavailable in this environment; tokens locked to moodboard.
 */
export const colors = {
  navy: '#1E1B4B',
  orange: '#F59E0B',
  white: '#FFFFFF',
  surface: '#F8FAFC',
  textPrimary: '#1E1B4B',
  textSecondary: '#64748B',
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

export const brand = {
  name: 'ÇözBil',
  exams: ['lgs', 'ygs', 'kpss'] as const,
};
