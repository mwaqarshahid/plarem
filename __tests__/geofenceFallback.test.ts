import notifee from '@notifee/react-native';
import { addReminder, hydrate, store } from '../src/store';
import { ReminderDraft } from '../src/types';
import { runGeofenceCheck, resetGeofenceFallback } from '../src/services/geofenceFallback';

const HOME = { latitude: 24.86, longitude: 67.0 };
const FAR = { latitude: 25.5, longitude: 67.8 }; // ~90 km away

const draft = (over: Partial<ReminderDraft> = {}): ReminderDraft => ({
  title: 'Buy eggs',
  location: { latitude: HOME.latitude, longitude: HOME.longitude, address: 'Home' },
  radius: 250,
  category: 'shopping',
  repeat: 'once',
  ...over,
});

const displayNotification = notifee.displayNotification as jest.Mock;

const firstPending = () => store.getState().reminders.items.find(r => r.status === 'pending');

beforeEach(() => {
  store.dispatch(hydrate([]));
  resetGeofenceFallback();
  displayNotification.mockClear();
});

describe('geofence software fallback', () => {
  it('fires an arrival when a fix lands inside the radius', async () => {
    store.dispatch(addReminder(draft()));
    const id = store.getState().reminders.items[0].id;

    await runGeofenceCheck(HOME, 1000);

    expect(displayNotification).toHaveBeenCalledTimes(1);
    const reminder = store.getState().reminders.items.find(r => r.id === id);
    expect(reminder?.status).toBe('completed');
    expect(reminder?.lastTriggeredAt).toBe(1000);
  });

  it('does not fire when the fix is outside the radius', async () => {
    store.dispatch(addReminder(draft()));
    await runGeofenceCheck(FAR, 1000);
    expect(displayNotification).not.toHaveBeenCalled();
  });

  it('does not re-fire a completed once-reminder', async () => {
    store.dispatch(addReminder(draft()));
    await runGeofenceCheck(HOME, 1000);
    displayNotification.mockClear();

    await runGeofenceCheck(HOME, 2000);
    expect(displayNotification).not.toHaveBeenCalled();
  });

  it('only fires on an outside→inside crossing, not while sitting inside', async () => {
    store.dispatch(addReminder(draft({ repeat: 'every_arrival' })));

    await runGeofenceCheck(HOME, 1000); // enter → fire
    expect(displayNotification).toHaveBeenCalledTimes(1);

    await runGeofenceCheck(HOME, 1500); // still inside → no fire
    expect(displayNotification).toHaveBeenCalledTimes(1);
  });

  it('re-fires a repeating reminder after leaving and returning past the cooldown', async () => {
    store.dispatch(addReminder(draft({ repeat: 'every_arrival' })));

    await runGeofenceCheck(HOME, 0); // enter → fire
    await runGeofenceCheck(FAR, 1000); // leave
    displayNotification.mockClear();

    // Return within the cooldown window → suppressed.
    await runGeofenceCheck(HOME, 2000);
    expect(displayNotification).not.toHaveBeenCalled();

    await runGeofenceCheck(FAR, 3000); // leave again
    // Return well past the 3-minute cooldown → fires.
    await runGeofenceCheck(HOME, 3000 + 3 * 60 * 1000 + 1);
    expect(displayNotification).toHaveBeenCalledTimes(1);

    expect(firstPending()).toBeTruthy(); // every_arrival stays pending
  });
});
