export const colors = {
  background: '#f5f7f5',
  surface: '#ffffff',
  surfaceMuted: '#e9eeea',
  border: '#cdd8d0',
  text: '#16221b',
  textMuted: '#5a6b60',
  primary: '#0f5132',
  primaryDark: '#0a3a24',
  primarySoft: '#d6e9de',
  onPrimary: '#ffffff',
  warning: '#9a6205',
  warningSoft: '#fdf1d6',
  onWarning: '#ffffff',
  onWarningSoft: '#5c3b02',
  danger: '#a32218',
  dangerSoft: '#fbe0dd',
  onDangerSoft: '#5c120c',
  offline: '#1f3b8a',
  onOffline: '#ffffff',
  success: '#1b7a45',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: 24,
  sectionTitle: 18,
  body: 15,
  caption: 13,
} as const;
