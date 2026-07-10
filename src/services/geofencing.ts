import Geofencing from '@rn-org/react-native-geofencing';
import { markTriggered, store, updateReminder } from '@store';
import { Reminder } from '@types';
import { initGeofenceFallback } from './geofenceFallback';
import { startForegroundService, stopForegroundService } from './foregroundService';

const shouldMonitor = (reminder: Reminder): boolean => reminder.status === 'pending';

/** Native addGeofence resolves this shape; it does NOT reject on failure. */
type AddGeofenceResult = { success?: boolean; id?: string; error?: string } | undefined;

/** iOS can monitor at most 20 regions per app; warn before we silently drop some. */
const MAX_MONITORED_REGIONS = 20;

/**
 * Snapshot of the last reconcile so the UI/diagnostics can tell the user which
 * reminders are actually armed at the OS level vs. only "pending" in the store.
 */
export interface GeofenceSyncReport {
  desired: number;
  registered: number;
  failedIds: string[];
  at: number;
}

let lastReport: GeofenceSyncReport | undefined;

export const getLastGeofenceSyncReport = (): GeofenceSyncReport | undefined => lastReport;

// Serialize reconciles: overlapping runs (e.g. the store subscription firing
// while handleEnter awaits its own sync) used to race on register/remove.
let syncChain: Promise<void> = Promise.resolve();

const runSync = async (): Promise<void> => {
  const now = Date.now();
  const reminders = store.getState().reminders.items;

  // Expire overdue reminders before deciding what to monitor.
  reminders
    .filter(r => r.expiresAt !== undefined && r.expiresAt < now && r.status === 'pending')
    .forEach(r =>
      store.dispatch(updateReminder({ id: r.id, changes: { status: 'expired' } })),
    );

  const current = store.getState().reminders.items;
  const desired = current.filter(shouldMonitor);
  const desiredIds = new Set(desired.map(r => r.id));

  if (desired.length > MAX_MONITORED_REGIONS) {
    console.warn(
      `[geofencing] ${desired.length} active reminders exceed the OS limit of ` +
        `${MAX_MONITORED_REGIONS}; some will not be monitored.`,
    );
  }

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

  const failedIds: string[] = [];
  await Promise.all(
    desired.map(async reminder => {
      try {
        const result = (await Geofencing.addGeofence({
          id: reminder.id,
          latitude: reminder.location.latitude,
          longitude: reminder.location.longitude,
          radius: Math.round(reminder.radius),
        })) as AddGeofenceResult;
        // The native module resolves { success: false, error } instead of
        // rejecting, so an unchecked promise hides real registration failures.
        if (result && result.success === false) {
          failedIds.push(reminder.id);
          console.warn(
            `[geofencing] failed to register "${reminder.title}" (${reminder.id}): ` +
              `${result.error ?? 'unknown error'}`,
          );
        }
      } catch (error) {
        failedIds.push(reminder.id);
        console.warn(`[geofencing] addGeofence threw for ${reminder.id}:`, error);
      }
    }),
  );

  // Keep the foreground location service alive exactly while something needs
  // monitoring. This is what makes Play Services fire transitions promptly and
  // keeps our process alive against aggressive battery managers.
  if (desired.length > 0) {
    startForegroundService(desired.length);
  } else {
    stopForegroundService();
  }

  lastReport = {
    desired: desired.length,
    registered: desired.length - failedIds.length,
    failedIds,
    at: now,
  };
};

/**
 * Reconciles the OS geofence registrations with the reminders in the store:
 * registers active pending reminders, removes everything else, and toggles the
 * foreground monitoring service. Safe to call repeatedly and concurrently — runs
 * are serialized so they cannot race on the native registration set.
 */
export const syncGeofences = (): Promise<void> => {
  syncChain = syncChain.then(runSync, runSync);
  return syncChain;
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

  // Software geofence fallback driven by the foreground service location stream.
  initGeofenceFallback();

  let lastItems = store.getState().reminders.items;
  store.subscribe(() => {
    const items = store.getState().reminders.items;
    if (items !== lastItems) {
      lastItems = items;
      syncGeofences().catch(() => undefined);
    }
  });
};
