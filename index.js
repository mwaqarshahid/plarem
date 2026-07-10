/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// Notifee requires its background handler at module scope before the app
// mounts — including when Android wakes the app for a notification tap.
import { initGeofencing } from './src/services/geofencing';
import { initNotificationEvents } from './src/services/notifications';

try {
  initGeofencing();
} catch (error) {
  console.error('[Plarem] initGeofencing failed:', error);
}

try {
  initNotificationEvents();
} catch (error) {
  console.error('[Plarem] initNotificationEvents failed:', error);
}

AppRegistry.registerComponent(appName, () => App);
