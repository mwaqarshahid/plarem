import { markTriggered, store } from '@store';
import { Reminder } from '@types';
import { distanceMeters } from '@utils/geo';
import type { Coordinates } from './location';
import { setCachedLocation } from './locationCache';
import { onBackgroundLocation } from './foregroundService';
import { showArrivalNotification } from './notifications';

/**
 * A software geofence check that runs off the foreground service's location
 * stream, independent of Play Services geofencing. Play Services is
 * opportunistic and regularly misses an entry when you drive through a fence
 * without stopping; this recomputes distance on every fix and fires the same
 * arrival notification when you are inside a fence.
 *
 * Dedup is safe against the native geofence path: notifications key off the
 * reminder id (so no visual duplicate), and `once` reminders flip to
 * `completed` on first trigger. A cooldown stops `every_arrival` reminders from
 * re-firing while you sit inside the radius.
 */

/** Do not re-fire the same reminder within this window (ms). */
const REFIRE_COOLDOWN_MS = 3 * 60 * 1000;

const shouldMonitor = (reminder: Reminder): boolean => reminder.status === 'pending';

/** Tracks whether we were last inside each fence, to detect outside→inside crossings. */
const insideState = new Map<string, boolean>();

let initialized = false;

const runGeofenceCheck = async (
  coords: Coordinates,
  now: number,
): Promise<void> => {
  const reminders = store.getState().reminders.items;
  const activeIds = new Set<string>();

  for (const reminder of reminders) {
    if (!shouldMonitor(reminder)) {
      continue;
    }
    activeIds.add(reminder.id);

    const distance = distanceMeters(
      coords.latitude,
      coords.longitude,
      reminder.location.latitude,
      reminder.location.longitude,
    );
    const inside = distance <= reminder.radius;
    const wasInside = insideState.get(reminder.id) ?? false;
    insideState.set(reminder.id, inside);

    if (!inside || wasInside) {
      continue;
    }

    const firedRecently =
      reminder.lastTriggeredAt !== undefined &&
      now - reminder.lastTriggeredAt < REFIRE_COOLDOWN_MS;
    if (firedRecently) {
      continue;
    }

    await showArrivalNotification(reminder);
    store.dispatch(markTriggered({ id: reminder.id, at: now }));
  }

  // Forget fences that are no longer pending so a re-enabled reminder can
  // trigger again on the next crossing.
  for (const id of insideState.keys()) {
    if (!activeIds.has(id)) {
      insideState.delete(id);
    }
  }
};

/** Feed a single location fix through the software geofence check. */
export const checkGeofencesAt = (coords: Coordinates): void => {
  setCachedLocation(coords);
  runGeofenceCheck(coords, Date.now()).catch(() => undefined);
};

/**
 * Subscribe the fallback to the foreground service's background location
 * stream. Idempotent; safe to call from the app entry point.
 */
export const initGeofenceFallback = (): void => {
  if (initialized) {
    return;
  }
  initialized = true;
  onBackgroundLocation(checkGeofencesAt);
};
