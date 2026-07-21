import { APP_NAME, APP_TAGLINE } from './config';

/**
 * Copy for the first-run permissions onboarding.
 * Single source of truth — keep UI components free of hardcoded user-facing strings.
 */
export const ONBOARDING = {
  welcome: {
    title: `Welcome to ${APP_NAME}`,
    body: `${APP_TAGLINE}. To work properly, ${APP_NAME} needs a few permissions on your device.`,
    continueLabel: 'Continue',
    features: [
      {
        icon: 'map-marker-outline',
        title: 'Location',
        description: 'Know when you arrive at a place you chose',
      },
      {
        icon: 'map-marker-radius-outline',
        title: 'Background location',
        description: 'Trigger reminders even when the app is closed',
      },
      {
        icon: 'bell-outline',
        title: 'Notifications',
        description: 'Alert you the moment a reminder fires',
      },
    ],
  },
  location: {
    title: 'Allow location access',
    body: `${APP_NAME} uses your location on-device to detect geofence arrivals. Nothing is uploaded.`,
    allowLabel: 'Allow while using the app',
    skipLabel: 'Not now',
  },
  background: {
    title: 'Allow all the time',
    body:
      'For reminders to fire in the background, Android needs "Allow all the time" location access. You can change this later in Settings.',
    allowLabel: 'Allow all the time',
    skipLabel: 'Skip for now',
  },
  battery: {
    title: 'Keep reminders running',
    body: `Some phones aggressively close background apps to save battery, which can stop reminders from firing. Allow ${APP_NAME} to keep monitoring so arrivals are never missed.`,
    allowLabel: 'Allow background activity',
    skipLabel: 'Skip for now',
  },
  notifications: {
    title: 'Allow notifications',
    body: 'Get notified the moment you arrive at a reminder location.',
    allowLabel: 'Allow notifications',
    skipLabel: 'Skip for now',
  },
} as const;
