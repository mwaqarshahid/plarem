import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemePreference } from '@theme';

export interface SettingsState {
  themePreference: ThemePreference;
  /** Whether onboarding permission flow completed at least once. */
  onboarded: boolean;
}

const initialState: SettingsState = {
  themePreference: 'system',
  onboarded: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    hydrateSettings(_state, action: PayloadAction<SettingsState>) {
      return { ...initialState, ...action.payload };
    },
    setThemePreference(state, action: PayloadAction<ThemePreference>) {
      state.themePreference = action.payload;
    },
    setOnboarded(state, action: PayloadAction<boolean>) {
      state.onboarded = action.payload;
    },
  },
});

export const { hydrateSettings, setThemePreference, setOnboarded } = settingsSlice.actions;

export default settingsSlice.reducer;
