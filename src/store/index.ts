import { configureStore } from '@reduxjs/toolkit';
import { readJson, writeJson } from '@storage';
import { Reminder } from '@types';
import remindersReducer, { RemindersState } from './remindersSlice';
import settingsReducer, { SettingsState } from './settingsSlice';

const loadPreloadedState = ():
  | { reminders: RemindersState; settings: SettingsState }
  | undefined => {
  const reminders = readJson<Reminder[]>('reminders');
  const settings = readJson<SettingsState>('settings');
  if (!reminders && !settings) {
    return undefined;
  }
  return {
    reminders: { items: reminders ?? [] },
    settings: {
      themePreference: settings?.themePreference ?? 'system',
      onboarded: settings?.onboarded ?? Boolean(settings),
      notificationSound: settings?.notificationSound ?? 'default',
    },
  };
};

export const store = configureStore({
  reducer: {
    reminders: remindersReducer,
    settings: settingsReducer,
  },
  preloadedState: loadPreloadedState(),
});

let lastReminders: Reminder[] | undefined;
let lastSettings: SettingsState | undefined;

store.subscribe(() => {
  const state = store.getState();
  if (state.reminders.items !== lastReminders) {
    lastReminders = state.reminders.items;
    writeJson('reminders', lastReminders);
  }
  if (state.settings !== lastSettings) {
    lastSettings = state.settings;
    writeJson('settings', lastSettings);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export * from './remindersSlice';
export * from './settingsSlice';
export * from './selectors';
