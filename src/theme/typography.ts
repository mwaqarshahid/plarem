import { TextStyle } from 'react-native';

type Typography = Record<
  | 'displayLarge'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'titleLarge'
  | 'titleMedium'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelSmall',
  TextStyle
>;

export const typography: Typography = {
  displayLarge: { fontSize: 40, fontWeight: '800', lineHeight: 48, letterSpacing: -0.5 },
  headlineLarge: { fontSize: 32, fontWeight: '700', lineHeight: 40, letterSpacing: -0.25 },
  headlineMedium: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  titleLarge: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  titleMedium: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  labelLarge: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  labelSmall: { fontSize: 11, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 },
};
