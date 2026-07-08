import { GOOGLE_MAPS_API_KEY as GENERATED_GOOGLE_MAPS_API_KEY } from './env.generated';

/**
 * Google Maps Platform API key for Places search and Geocoding HTTP calls.
 * The native map SDK reads the same key from the project root `.env` file
 * at Android build time (see android/app/build.gradle).
 */
export const GOOGLE_MAPS_API_KEY = GENERATED_GOOGLE_MAPS_API_KEY?.trim() ?? '';

export const APP_NAME = 'Plarem';

/** Android notification channel for geofence reminders. */
export const REMINDER_CHANNEL_ID = 'plarem-reminders';
