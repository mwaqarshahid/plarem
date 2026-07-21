import { BRAND } from '../constants/brand';

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  onError: string;
  success: string;
  warning: string;
  card: string;
  border: string;
  ripple: string;
  overlay: string;
}

/** UI theme keyed to the Plarem brand palette (arrow blue + ink + lime accents). */
export const lightColors: ThemeColors = {
  primary: BRAND.arrow,
  onPrimary: BRAND.white,
  primaryContainer: '#D7EEF8',
  onPrimaryContainer: '#0A3A52',
  secondary: BRAND.ink,
  onSecondary: BRAND.white,
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF0F3',
  onSurface: BRAND.ink,
  onSurfaceVariant: '#5C6070',
  outline: '#C6C9D0',
  error: '#C94B5A',
  onError: '#FFFFFF',
  success: '#5B8C1A',
  warning: '#C4A014',
  card: '#FFFFFF',
  border: '#E4E6EB',
  ripple: 'rgba(43, 159, 216, 0.14)',
  overlay: 'rgba(30, 33, 38, 0.45)',
};

export const darkColors: ThemeColors = {
  primary: '#5BB8E0',
  onPrimary: '#062636',
  primaryContainer: '#1A4F66',
  onPrimaryContainer: '#D7EEF8',
  secondary: '#E8EAED',
  onSecondary: BRAND.ink,
  background: '#0F1117',
  surface: '#181B24',
  surfaceVariant: '#232733',
  onSurface: '#E9EAF2',
  onSurfaceVariant: '#A3A7B8',
  outline: '#4A4E5F',
  error: '#FF7A82',
  onError: '#3A0A0E',
  success: '#B8D23A',
  warning: '#D7DF23',
  card: '#181B24',
  border: '#272B38',
  ripple: 'rgba(91, 184, 224, 0.18)',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
