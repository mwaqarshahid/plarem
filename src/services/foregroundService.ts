import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { Coordinates } from './location';

/**
 * Thin wrapper over the native `PlaremGeo` module (Android only). It controls
 * the foreground location service that keeps geofencing responsive, and exposes
 * the battery-optimization exemption flow. On iOS every method is a safe no-op.
 */
interface PlaremGeoNative {
  startService: (count: number) => void;
  stopService: () => void;
  isServiceRunning: () => Promise<boolean>;
  isIgnoringBatteryOptimizations: () => Promise<boolean>;
  requestIgnoreBatteryOptimizations: () => void;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}

const native: PlaremGeoNative | undefined =
  Platform.OS === 'android' ? NativeModules.PlaremGeo : undefined;

const emitter = native ? new NativeEventEmitter(NativeModules.PlaremGeo) : undefined;

const LOCATION_EVENT = 'PlaremGeoLocation';

export const isForegroundServiceSupported = (): boolean => native !== undefined;

/** Start (or update) the foreground monitoring service. `count` is shown in the notification. */
export const startForegroundService = (count: number): void => {
  try {
    native?.startService(count);
  } catch {
    // Ignore — the geofence path still functions without it.
  }
};

export const stopForegroundService = (): void => {
  try {
    native?.stopService();
  } catch {
    // Ignore.
  }
};

export const isForegroundServiceRunning = async (): Promise<boolean> => {
  try {
    return (await native?.isServiceRunning()) ?? false;
  } catch {
    return false;
  }
};

export const isIgnoringBatteryOptimizations = async (): Promise<boolean> => {
  try {
    // Treat "unsupported platform" as fine so callers don't nag on iOS.
    return (await native?.isIgnoringBatteryOptimizations()) ?? true;
  } catch {
    return true;
  }
};

export const requestIgnoreBatteryOptimizations = (): void => {
  try {
    native?.requestIgnoreBatteryOptimizations();
  } catch {
    // Ignore.
  }
};

/**
 * Subscribe to background location fixes emitted by the foreground service.
 * Returns an unsubscribe function. No-op on unsupported platforms.
 */
export const onBackgroundLocation = (
  listener: (coords: Coordinates) => void,
): (() => void) => {
  if (!emitter) {
    return () => undefined;
  }
  const subscription = emitter.addListener(
    LOCATION_EVENT,
    (coords: Coordinates) => listener(coords),
  );
  return () => subscription.remove();
};
