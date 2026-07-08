import { createMMKV, type MMKV } from 'react-native-mmkv';

export const storage: MMKV = createMMKV({ id: 'plarem' });

const KEYS = {
  reminders: 'reminders.v1',
  settings: 'settings.v1',
} as const;

export const readJson = <T>(key: keyof typeof KEYS): T | undefined => {
  const raw = storage.getString(KEYS[key]);
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

export const writeJson = (key: keyof typeof KEYS, value: unknown): void => {
  storage.set(KEYS[key], JSON.stringify(value));
};
