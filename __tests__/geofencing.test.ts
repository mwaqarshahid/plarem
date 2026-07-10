jest.mock('../src/services/foregroundService', () => ({
  startForegroundService: jest.fn(),
  stopForegroundService: jest.fn(),
  onBackgroundLocation: jest.fn(() => () => undefined),
}));

import Geofencing from '@rn-org/react-native-geofencing';
import { addReminder, hydrate, store } from '../src/store';
import { ReminderDraft } from '../src/types';
import { getLastGeofenceSyncReport, syncGeofences } from '../src/services/geofencing';
import { startForegroundService, stopForegroundService } from '../src/services/foregroundService';

const addGeofence = Geofencing.addGeofence as jest.Mock;
const removeGeofence = Geofencing.removeGeofence as jest.Mock;
const getRegistered = Geofencing.getRegisteredGeofences as jest.Mock;
const startService = startForegroundService as jest.Mock;
const stopService = stopForegroundService as jest.Mock;

const draft = (title: string): ReminderDraft => ({
  title,
  location: { latitude: 24.86, longitude: 67.0, address: 'Home' },
  radius: 1000,
  category: 'shopping',
  repeat: 'once',
});

beforeEach(() => {
  store.dispatch(hydrate([]));
  addGeofence.mockReset().mockResolvedValue({ success: true });
  removeGeofence.mockReset().mockResolvedValue({ success: true });
  getRegistered.mockReset().mockResolvedValue([]);
  startService.mockClear();
  stopService.mockClear();
});

describe('syncGeofences hardening', () => {
  it('registers every pending reminder and starts the service with the count', async () => {
    store.dispatch(addReminder(draft('A')));
    store.dispatch(addReminder(draft('B')));

    await syncGeofences();

    expect(addGeofence).toHaveBeenCalledTimes(2);
    expect(startService).toHaveBeenCalledWith(2);
    expect(stopService).not.toHaveBeenCalled();

    const report = getLastGeofenceSyncReport();
    expect(report?.desired).toBe(2);
    expect(report?.registered).toBe(2);
    expect(report?.failedIds).toHaveLength(0);
  });

  it('records a reminder that the OS refused to register (success:false)', async () => {
    store.dispatch(addReminder(draft('A')));
    const id = store.getState().reminders.items[0].id;
    addGeofence.mockResolvedValueOnce({ success: false, error: 'GEOFENCE_NOT_AVAILABLE' });

    await syncGeofences();

    const report = getLastGeofenceSyncReport();
    expect(report?.failedIds).toContain(id);
    expect(report?.registered).toBe(0);
  });

  it('stops the service when nothing needs monitoring', async () => {
    await syncGeofences();
    expect(addGeofence).not.toHaveBeenCalled();
    expect(stopService).toHaveBeenCalled();
    expect(startService).not.toHaveBeenCalled();
  });

  it('removes OS registrations that are no longer wanted', async () => {
    getRegistered.mockResolvedValueOnce(['stale-id']);
    store.dispatch(addReminder(draft('A')));

    await syncGeofences();

    expect(removeGeofence).toHaveBeenCalledWith('stale-id');
  });

  it('serializes overlapping reconciles', async () => {
    store.dispatch(addReminder(draft('A')));
    let concurrent = 0;
    let maxConcurrent = 0;
    getRegistered.mockImplementation(async () => {
      concurrent += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await Promise.resolve();
      concurrent -= 1;
      return [];
    });

    await Promise.all([syncGeofences(), syncGeofences(), syncGeofences()]);

    expect(maxConcurrent).toBe(1);
  });
});
