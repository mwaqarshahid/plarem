import { Platform } from 'react-native';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

export type PermissionState = 'granted' | 'denied' | 'blocked' | 'unavailable';

const mapResult = (result: string): PermissionState => {
  switch (result) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    default:
      return 'denied';
  }
};

const foregroundLocationPermission = Platform.select({
  android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
})!;

export const checkForegroundLocation = async (): Promise<PermissionState> =>
  mapResult(await check(foregroundLocationPermission));

export const requestForegroundLocation = async (): Promise<PermissionState> =>
  mapResult(await request(foregroundLocationPermission));

/**
 * Background ("Allow all the time") location. Required for geofencing on
 * Android 10+; on iOS this maps to "Always" authorization.
 * Must be requested only after foreground location is granted.
 */
export const requestBackgroundLocation = async (): Promise<PermissionState> => {
  if (Platform.OS === 'android') {
    return mapResult(await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION));
  }
  return mapResult(await request(PERMISSIONS.IOS.LOCATION_ALWAYS));
};

export const checkBackgroundLocation = async (): Promise<PermissionState> => {
  if (Platform.OS === 'android') {
    return mapResult(await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION));
  }
  return mapResult(await check(PERMISSIONS.IOS.LOCATION_ALWAYS));
};

export const requestNotifications = async (): Promise<PermissionState> => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED ? 'granted' : 'denied';
};

export const checkNotifications = async (): Promise<PermissionState> => {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED ? 'granted' : 'denied';
};

export const openAppSettings = (): Promise<void> => openSettings();
