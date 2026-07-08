import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemePreference } from '@theme';
import { NotificationSoundId } from '@constants';

export interface SettingsState {
  themePreference: ThemePreference;
  /** Whether onboarding permission flow completed at least once. */
  onboarded: boolean;
  /** Default tone for new reminders' arrival notifications. */
  notificationSound: NotificationSoundId;
}

const initialState: SettingsState = {
  themePreference: 'system',
  onboarded: false,
  notificationSound: 'default',
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
    setNotificationSound(state, action: PayloadAction<NotificationSoundId>) {
      state.notificationSound = action.payload;
    },
  },
});

export const { hydrateSettings, setThemePreference, setOnboarded, setNotificationSound } =
  settingsSlice.actions;

export default settingsSlice.reducer;
