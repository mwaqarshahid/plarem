/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// Both inits must happen at module scope: Android can launch the app
// headlessly for a geofence transition, and Notifee requires its background
// event handler to be registered before the app mounts.
import { initGeofencing } from './src/services/geofencing';
import { initNotificationEvents } from './src/services/notifications';

initGeofencing();
initNotificationEvents();

AppRegistry.registerComponent(appName, () => App);
