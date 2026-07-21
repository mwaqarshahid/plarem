import type { Region } from 'react-native-maps';
import identity from '../../brand/identity.json';
import {
  APP_VERSION as GENERATED_APP_VERSION,
  GOOGLE_MAPS_API_KEY as GENERATED_GOOGLE_MAPS_API_KEY,
} from './env.generated';

/** Stamped from package.json (the single source of truth) by scripts/sync-env.js. */
export const APP_VERSION = GENERATED_APP_VERSION;

// Brand identity comes from brand/identity.json — the single source of truth
// shared with the brand-asset generator (scripts/generate-brand-assets.js).
export const APP_NAME = identity.name;

export const APP_TAGLINE = identity.tagline;

export const APP_MOTTO = identity.motto;

export const APP_PRIVACY_NOTE =
  'Reminders are stored locally on this device. Location is only used on-device to trigger geofences; nothing is uploaded.';

/**
 * Google Maps Platform API key for Places search and Geocoding HTTP calls.
 * The native map SDK reads the same key from the project root `.env` file
 * at Android build time (see android/app/build.gradle).
 */
export const GOOGLE_MAPS_API_KEY = GENERATED_GOOGLE_MAPS_API_KEY?.trim() ?? '';

/** Android notification channel for geofence reminders. */
export const REMINDER_CHANNEL_ID = 'plarem-reminders';

export const PERMISSION_STATE_LABELS = {
  granted: 'Granted',
  denied: 'Tap to grant',
  blocked: 'Blocked — tap to open settings',
  unavailable: 'Unavailable',
} as const satisfies Record<string, string>;

export type PermissionLabelState = keyof typeof PERMISSION_STATE_LABELS;

export const DEFAULT_MAP_REGION: Region = {
  latitude: 24.8607,
  longitude: 67.0011,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
