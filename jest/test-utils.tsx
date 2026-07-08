import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@theme';
import remindersReducer from '@store/remindersSlice';
import settingsReducer from '@store/settingsSlice';
import type { RootState } from '@store';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const createTestStore = (preloadedState?: DeepPartial<RootState>) =>
  configureStore({
    reducer: {
      reminders: remindersReducer,
      settings: settingsReducer,
    },
    preloadedState: preloadedState as RootState | undefined,
  });

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: DeepPartial<RootState>;
  themePreference?: 'light' | 'dark' | 'system';
}

export const renderWithProviders = async (
  ui: ReactElement,
  {
    preloadedState,
    themePreference = 'light',
    ...options
  }: ExtendedRenderOptions = {},
) => {
  const store = createTestStore(preloadedState);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider preference={themePreference}>{children}</ThemeProvider>
    </Provider>
  );

  const view = await render(ui, { wrapper: Wrapper, ...options });
  return { store, ...view };
};
