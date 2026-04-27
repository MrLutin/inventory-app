import { useColorScheme } from 'react-native';

// ─── Light ────────────────────────────────────────────────────────────────────

export const Colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryBg: '#EEF2FF',
  accent: '#10B981',
  accentLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  black: '#0F172A',
  gray900: '#1E293B',
  gray800: '#334155',
  gray600: '#475569',
  gray400: '#94A3B8',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
  gray50: '#F8FAFC',
  white: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  background: '#F8FAFC',
  border: '#E2E8F0',
  borderFocus: '#6366F1',
  cat: {
    electronics: { bg: '#EEF2FF', text: '#6366F1' },
    clothing:    { bg: '#FDF2F8', text: '#EC4899' },
    food:        { bg: '#ECFDF5', text: '#10B981' },
    furniture:   { bg: '#FFF7ED', text: '#F97316' },
    tools:       { bg: '#F0FDF4', text: '#22C55E' },
    other:       { bg: '#F8FAFC', text: '#64748B' },
  },
};

// ─── Dark ─────────────────────────────────────────────────────────────────────

export const DarkColors: typeof Colors = {
  primary: '#818CF8',
  primaryLight: '#6366F1',
  primaryDark: '#4F46E5',
  primaryBg: '#1E1B4B',
  accent: '#34D399',
  accentLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#451A03',
  danger: '#F87171',
  dangerLight: '#450A0A',
  black: '#F1F5F9',
  gray900: '#E2E8F0',
  gray800: '#CBD5E1',
  gray600: '#94A3B8',
  gray400: '#64748B',
  gray200: '#1E293B',
  gray100: '#1E293B',
  gray50: '#0F172A',
  white: '#FFFFFF',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  background: '#0F172A',
  border: '#334155',
  borderFocus: '#818CF8',
  cat: {
    electronics: { bg: '#1E1B4B', text: '#818CF8' },
    clothing:    { bg: '#500724', text: '#F9A8D4' },
    food:        { bg: '#064E3B', text: '#34D399' },
    furniture:   { bg: '#431407', text: '#FB923C' },
    tools:       { bg: '#052E16', text: '#4ADE80' },
    other:       { bg: '#1E293B', text: '#94A3B8' },
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : Colors;
}

// ─── Typography / Spacing / Radius / Shadow ───────────────────────────────────

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  h4: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
};
