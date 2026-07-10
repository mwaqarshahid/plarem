import Geolocation from '@react-native-community/geolocation';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  locationProvider: 'auto',
});

export const getCurrentPosition = (
  highAccuracy = true,
  options: Partial<PositionOptions> = {},
): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      error => reject(new Error(error.message)),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? highAccuracy,
        timeout: options.timeout ?? (highAccuracy ? 12000 : 5000),
        maximumAge: options.maximumAge ?? (highAccuracy ? 10000 : 300000),
      },
    );
  });

/** Prefer cached/network fix — fast for map centering on open. Never use for reminder pins. */
export const getCurrentPositionFast = (): Promise<Coordinates> =>
  getCurrentPosition(false, { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 });

/** Fresh GPS fix for "current location" and geofence registration — no stale fallbacks. */
export const getFreshPosition = (): Promise<Coordinates> =>
  getCurrentPosition(true, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
