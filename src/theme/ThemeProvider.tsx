import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

const buildTheme = (dark: boolean): Theme => ({
  dark,
  colors: dark ? darkColors : lightColors,
  spacing,
  radius,
  typography,
});

const ThemeContext = createContext<Theme>(buildTheme(false));

interface ThemeProviderProps {
  preference: ThemePreference;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ preference, children }) => {
  const systemScheme = useColorScheme();
  const dark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
  const theme = useMemo(() => buildTheme(dark), [dark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => useContext(ThemeContext);
