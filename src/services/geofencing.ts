import Geofencing from '@rn-org/react-native-geofencing';
import { markTriggered, store, updateReminder } from '@store';
import { Reminder } from '@types';

const shouldMonitor = (reminder: Reminder): boolean =>
  reminder.enabled && reminder.status === 'pending';

/**
 * Reconciles the OS geofence registrations with the reminders in the store:
 * registers active pending reminders, removes everything else. Safe to call
 * repeatedly; the OS treats addGeofence with an existing id as an update.
 */
export const syncGeofences = async (): Promise<void> => {
  const now = Date.now();
  const reminders = store.getState().reminders.items;

  // Expire overdue reminders before deciding what to monitor.
  reminders
    .filter(r => r.expiresAt !== undefined && r.expiresAt < now && r.status === 'pending')
    .forEach(r =>
      store.dispatch(updateReminder({ id: r.id, changes: { status: 'expired', enabled: false } })),
    );

  const current = store.getState().reminders.items;
  const desired = current.filter(shouldMonitor);
  const desiredIds = new Set(desired.map(r => r.id));

  let registered: string[] = [];
  try {
    registered = await Geofencing.getRegisteredGeofences();
  } catch {
    registered = [];
  }

  await Promise.all(
    registered
      .filter(id => !desiredIds.has(id))
      .map(id => Geofencing.removeGeofence(id).catch(() => undefined)),
  );

  await Promise.all(
    desired.map(reminder =>
      Geofencing.addGeofence({
        id: reminder.id,
        latitude: reminder.location.latitude,
        longitude: reminder.location.longitude,
        radius: Math.round(reminder.radius),
      }).catch(() => undefined),
    ),
  );
};

const handleEnter = async (ids: string[]): Promise<void> => {
  const { showArrivalNotification } = await import('./notifications');
  const items = store.getState().reminders.items;
  const now = Date.now();

  for (const id of ids) {
    const reminder = items.find(r => r.id === id);
    if (!reminder || !shouldMonitor(reminder)) {
      continue;
    }
    await showArrivalNotification(reminder);
    store.dispatch(markTriggered({ id, at: now }));
  }

  await syncGeofences();
};

let initialized = false;

/**
 * Attaches the geofence enter listener and keeps native registrations in
 * sync with store changes. Called once from the app entry point — including
 * when Android wakes the app headlessly for a geofence transition.
 */
export const initGeofencing = (): void => {
  if (initialized) {
    return;
  }
  initialized = true;

  Geofencing.onEnter((ids: string[]) => {
    handleEnter(ids).catch(() => undefined);
  });

  let lastItems = store.getState().reminders.items;
  store.subscribe(() => {
    const items = store.getState().reminders.items;
    if (items !== lastItems) {
      lastItems = items;
      syncGeofences().catch(() => undefined);
    }
  });
};
