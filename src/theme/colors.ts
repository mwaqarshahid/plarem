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

export const lightColors: ThemeColors = {
  primary: '#4F5BE8',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E1E3FF',
  onPrimaryContainer: '#1A1D66',
  secondary: '#00A98F',
  onSecondary: '#FFFFFF',
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF0F7',
  onSurface: '#171A23',
  onSurfaceVariant: '#5C6070',
  outline: '#C6C9D6',
  error: '#DC3A45',
  onError: '#FFFFFF',
  success: '#1F9D5B',
  warning: '#E8930C',
  card: '#FFFFFF',
  border: '#E4E6EF',
  ripple: 'rgba(79, 91, 232, 0.12)',
  overlay: 'rgba(15, 17, 26, 0.45)',
};

export const darkColors: ThemeColors = {
  primary: '#9BA3FF',
  onPrimary: '#151845',
  primaryContainer: '#343B8F',
  onPrimaryContainer: '#E1E3FF',
  secondary: '#3DD9BD',
  onSecondary: '#00382E',
  background: '#0F1117',
  surface: '#181B24',
  surfaceVariant: '#232733',
  onSurface: '#E9EAF2',
  onSurfaceVariant: '#A3A7B8',
  outline: '#4A4E5F',
  error: '#FF7A82',
  onError: '#3A0A0E',
  success: '#4CD98A',
  warning: '#FFB84D',
  card: '#181B24',
  border: '#272B38',
  ripple: 'rgba(155, 163, 255, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
