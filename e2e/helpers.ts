/** Shared Detox helpers for Plarem E2E suites. */
import { execSync } from 'child_process';

const ANDROID_PACKAGE = 'com.plarem';

export const skipOnboarding = async (): Promise<void> => {
  await waitFor(element(by.id('onboarding-continue')))
    .toBeVisible()
    .withTimeout(15000);

  await element(by.id('onboarding-continue')).tap();
  await element(by.id('onboarding-skip-location')).tap();
  await element(by.id('onboarding-skip-background')).tap();
  if (device.getPlatform() === 'android') {
    // Battery-optimization exemption step exists on Android only.
    await element(by.id('onboarding-skip-battery')).tap();
  }
  await element(by.id('onboarding-skip-notifications')).tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(10000);
};

/** Wake the screen and dismiss the keyguard — an attached device with a dark
 * or locked screen never gives the app window focus, failing every matcher. */
export const wakeDevice = (): void => {
  if (device.getPlatform() !== 'android') {
    return;
  }
  try {
    adbShell('input keyevent KEYCODE_WAKEUP');
    adbShell('wm dismiss-keyguard');
    adbShell('settings put global stay_on_while_plugged_in 7');
  } catch {
    // Best effort; emulators are already awake.
  }
};

export const launchFresh = async (): Promise<void> => {
  wakeDevice();
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
  grantAndroidPermissions();
};

const getAdbSerial = (): string | undefined =>
  process.env.ANDROID_SERIAL || device.id || undefined;

const adbShell = (command: string): string => {
  const serial = getAdbSerial();
  const adb = serial ? `adb -s ${serial}` : 'adb';
  return execSync(`${adb} shell ${command}`, { encoding: 'utf8' });
};

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Both platform providers must be mocked: Google Play services' fused
 * provider derives balanced-power fixes from the NETWORK provider, so mocking
 * only `gps` leaves FLP (and Play Services geofencing, and the app's
 * foreground-service stream) following the device's real wifi/cell position.
 */
const MOCK_PROVIDERS = ['gps', 'network'] as const;

const addTestProvider = (provider: string): void => {
  adbShell(
    `cmd location providers add-test-provider ${provider} --supportsSpeed --supportsBearing --supportsAltitude`,
  );
};

/** Tear down and re-register shell test providers (Samsung drops them often). */
const forceMockProviders = (): void => {
  try {
    adbShell('appops set com.android.shell android:mock_location allow');
  } catch {
    // Non-fatal when the device is waking or appops is briefly unavailable.
  }
  for (const provider of MOCK_PROVIDERS) {
    try {
      adbShell(`cmd location providers remove-test-provider ${provider}`);
    } catch {
      // Not a test provider yet, or already removed.
    }
    try {
      addTestProvider(provider);
    } catch {
      // Already registered as a test provider — continue.
    }
    try {
      adbShell(`cmd location providers set-test-provider-enabled ${provider} true`);
    } catch {
      // Provider may be mid-rebuild; injectMockFix will force a full retry.
    }
  }
};

/**
 * Register adb-driven mock location providers. FusedLocationProvider (and
 * hence Play Services geofencing and the app's foreground-service stream)
 * then follows mock fixes, letting tests simulate drives on a real device.
 *
 * CAUTION: call this AFTER `launchFresh()` / any `pm grant` of a location
 * permission — granting location permissions makes LocationManagerService
 * rebuild its provider state, silently removing shell test providers.
 */
export const enableMockLocation = (): void => {
  forceMockProviders();
};

export const disableMockLocation = (): void => {
  for (const provider of MOCK_PROVIDERS) {
    try {
      adbShell(`cmd location providers remove-test-provider ${provider}`);
    } catch {
      // Already removed.
    }
  }
};

const injectMockFix = ({ latitude, longitude }: LatLng): void => {
  for (const provider of MOCK_PROVIDERS) {
    adbShell(
      `cmd location providers set-test-provider-location ${provider} --location ${latitude},${longitude} --accuracy 5`,
    );
  }
};

export const setMockLocation = (point: LatLng): void => {
  try {
    injectMockFix(point);
  } catch {
    forceMockProviders();
    injectMockFix(point);
  }
};

const mockFixIsActive = ({ latitude, longitude }: LatLng): boolean => {
  try {
    const out = adbShell('dumpsys location');
    const lat = latitude.toFixed(2);
    const lng = longitude.toFixed(2);
    return out.includes('mock') && out.includes(lat) && out.includes(lng);
  } catch {
    return false;
  }
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Bring the mock provider up and PROVE it accepts fixes, retrying while
 * LocationManagerService settles. Directly after a location `pm grant` the
 * service rebuilds provider state asynchronously: test providers are removed,
 * and add-test-provider calls inside that window exit 0 but are silently
 * dropped. Verifying with a real injection is the only reliable signal.
 */
export const ensureMockLocationReady = async (
  probe: LatLng,
  timeoutMs = 45000,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      forceMockProviders();
      injectMockFix(probe);
      if (mockFixIsActive(probe)) {
        return;
      }
      throw new Error('Mock fix not visible in dumpsys location');
    } catch (error) {
      lastError = error;
      await sleep(2000);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Mock location provider never became ready');
};

/** Pick a map point after adb mock has centered the picker (avoids getFreshPosition). */
export const pickMapCenterAfterMock = async (point: LatLng): Promise<void> => {
  setMockLocation(point);
  await sleep(1500);
  try {
    await waitFor(element(by.text('Centering on your location…')))
      .not.toBeVisible()
      .withTimeout(15000);
  } catch {
    // Map may already be centered.
  }
  setMockLocation(point);
  await element(by.id('location-picker-map')).tap({ x: 200, y: 350 });
  await waitFor(element(by.text('Tap the map, search or use your current location.')))
    .not.toBeVisible()
    .withTimeout(20000);
};

/**
 * Hold a mock position for a duration, re-injecting every few seconds so the
 * fused provider keeps reporting it (a single stale fix can be discarded).
 */
export const holdMockLocation = async (point: LatLng, durationMs: number): Promise<void> => {
  const stepMs = 3000;
  const steps = Math.max(1, Math.ceil(durationMs / stepMs));
  for (let i = 0; i < steps; i += 1) {
    setMockLocation(point);
    await sleep(stepMs);
  }
};

/**
 * Simulate driving from one point to another: injects interpolated fixes every
 * `stepMs`. The app's foreground-service location request delivers at most one
 * fix per ~10s, so the dwell inside a fence must exceed that.
 */
export const driveBetween = async (
  from: LatLng,
  to: LatLng,
  options: { fixes?: number; stepMs?: number } = {},
): Promise<void> => {
  const fixes = options.fixes ?? 6;
  const stepMs = options.stepMs ?? 4000;
  for (let i = 0; i <= fixes; i += 1) {
    const t = i / fixes;
    setMockLocation({
      latitude: from.latitude + (to.latitude - from.latitude) * t,
      longitude: from.longitude + (to.longitude - from.longitude) * t,
    });
    await sleep(stepMs);
  }
};

/** Whether the Plarem foreground monitoring service is currently running. */
export const isMonitorServiceRunning = (): boolean => {
  try {
    const out = adbShell(`dumpsys activity services ${ANDROID_PACKAGE}/.geo.PlaremGeoService`);
    return out.includes('PlaremGeoService');
  } catch {
    return false;
  }
};

/** Count arrival notifications currently posted that contain the given title. */
export const notificationPosted = (title: string): boolean => {
  try {
    const out = adbShell(`dumpsys notification --noredact`);
    return out.includes(title);
  } catch {
    return false;
  }
};

/** Grant runtime permissions so reminders can save without system dialogs. */
export const grantAndroidPermissions = (): void => {
  if (device.getPlatform() !== 'android') {
    return;
  }

  const serial = getAdbSerial();
  const adb = serial ? `adb -s ${serial}` : 'adb';
  const permissions = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.POST_NOTIFICATIONS',
  ];

  for (const permission of permissions) {
    try {
      execSync(`${adb} shell pm grant ${ANDROID_PACKAGE} ${permission}`, { stdio: 'ignore' });
    } catch {
      // Ignore grant failures on older API levels or already-granted permissions.
    }
  }

  try {
    execSync(`${adb} shell appops set ${ANDROID_PACKAGE} ACCESS_BACKGROUND_LOCATION allow`, {
      stdio: 'ignore',
    });
  } catch {
    // Some OEM builds reject appops overrides.
  }

  try {
    // Battery-optimization exemption, mirroring the onboarding "Allow
    // background activity" step, so the monitoring service survives Doze.
    execSync(`${adb} shell dumpsys deviceidle whitelist +${ANDROID_PACKAGE}`, { stdio: 'ignore' });
  } catch {
    // Non-fatal on OEMs that reject the whitelist command.
  }
};

export const dismissAlertIfVisible = async (): Promise<void> => {
  try {
    await waitFor(element(by.id('app-alert-dialog')))
      .toBeVisible()
      .withTimeout(1500);
    await element(by.id('alert-button-ok')).tap();
  } catch {
    // No alert on screen.
  }
};

export const openCreateReminder = async (): Promise<void> => {
  await element(by.id('home-fab')).tap();
  await waitFor(element(by.id('reminder-form-screen')))
    .toBeVisible()
    .withTimeout(8000);
};

const settle = (ms = 600): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const scrollFormTo = async (testID: string): Promise<void> => {
  const target = element(by.id(testID));
  const scrollView = element(by.id('reminder-form-screen'));

  try {
    await waitFor(target).toBeVisible().withTimeout(1500);
    return;
  } catch {
    // Keep scrolling until the target is on screen.
  }

  for (let attempt = 0; attempt < 14; attempt += 1) {
    try {
      await waitFor(target).toBeVisible().withTimeout(600);
      // A tap during scroll deceleration is consumed as "stop scrolling"
      // instead of a click — give the ScrollView a moment to settle.
      await settle();
      return;
    } catch {
      await scrollView.scroll(380, attempt < 8 ? 'down' : 'up', 0.5, 0.5);
    }
  }

  await waitFor(target).toBeVisible().withTimeout(8000);
  await settle();
};

export const scrollDetailsTo = async (testID: string): Promise<void> => {
  const target = element(by.id(testID));
  const scrollView = element(by.id('reminder-details-screen'));

  try {
    await waitFor(target).toBeVisible().withTimeout(1500);
    return;
  } catch {
    // Keep scrolling until the target is on screen.
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      await waitFor(target).toBeVisible().withTimeout(600);
      return;
    } catch {
      await scrollView.scroll(320, attempt < 7 ? 'down' : 'up', 0.5, 0.5);
    }
  }

  await waitFor(target).toBeVisible().withTimeout(8000);
};

export const fillText = async (testID: string, value: string): Promise<void> => {
  const field = element(by.id(testID));
  await field.tap();
  await field.replaceText(value);
  try {
    await device.pressBack();
  } catch {
    // Keyboard may already be dismissed.
  }
};

export const tapFormSave = async (): Promise<void> => {
  await scrollFormTo('form-save');
  await element(by.id('form-save')).tap();
};

const pickLocationViaSearch = async (): Promise<void> => {
  const search = element(by.id('location-picker-search'));
  await search.tap();
  await search.replaceText('Supermarket');
  await waitFor(element(by.id('location-picker-suggestion-0')))
    .toBeVisible()
    .withTimeout(20000);
  await element(by.id('location-picker-suggestion-0')).tap();
};

const pickLocationViaGps = async (): Promise<void> => {
  await element(by.id('location-picker-current')).tap();
  await waitFor(element(by.text('Tap the map, search or use your current location.')))
    .not.toBeVisible()
    .withTimeout(20000);
};

export const pickLocationOnMap = async (): Promise<void> => {
  await element(by.id('form-location-card')).tap();
  await waitFor(element(by.id('location-picker-screen')))
    .toBeVisible()
    .withTimeout(10000);
  await dismissAlertIfVisible();

  try {
    await pickLocationViaSearch();
  } catch {
    await pickLocationViaGps();
  }

  try {
    await waitFor(element(by.text('Resolving address…')))
      .not.toBeVisible()
      .withTimeout(15000);
  } catch {
    // Geocode may finish before the matcher runs.
  }

  await waitFor(element(by.id('location-picker-confirm')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('location-picker-confirm')).tap();
  await waitFor(element(by.id('reminder-form-screen')))
    .toBeVisible()
    .withTimeout(8000);
  await waitFor(element(by.id('form-location-label')))
    .not.toHaveText('Choose a location')
    .withTimeout(8000);
};

export const openReminderFromHome = async (title: string): Promise<void> => {
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(8000);
  try {
    await waitFor(element(by.text(title)))
      .toBeVisible()
      .withTimeout(4000);
  } catch {
    // Long list — scroll until the card is on screen.
    await waitFor(element(by.text(title)))
      .toBeVisible()
      .whileElement(by.id('home-reminder-list'))
      .scroll(300, 'down');
  }
  await element(by.text(title)).tap();
  await waitFor(element(by.id('reminder-details-screen')))
    .toBeVisible()
    .withTimeout(8000);
};

export const createReminder = async (title: string): Promise<void> => {
  await openCreateReminder();
  await fillText('form-title', title);
  await pickLocationOnMap();

  await tapFormSave();
  await dismissAlertIfVisible();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(15000);
  await waitFor(element(by.text(title)))
    .toBeVisible()
    .withTimeout(8000);
};

/**
 * Create a reminder pinned to the current (mocked) device location via the
 * picker's "Current location" button — deterministic, no map taps or Places
 * search. Selects the given radius preset (defaults to 1 km, mirroring a
 * realistic drive-through fence).
 */
export const createReminderAtCurrentLocation = async (
  title: string,
  radiusPreset: number = 1000,
): Promise<void> => {
  await openCreateReminder();
  await fillText('form-title', title);

  await element(by.id('form-location-card')).tap();
  await waitFor(element(by.id('location-picker-screen')))
    .toBeVisible()
    .withTimeout(10000);
  await dismissAlertIfVisible();

  await element(by.id('location-picker-current')).tap();
  await waitFor(element(by.text('Tap the map, search or use your current location.')))
    .not.toBeVisible()
    .withTimeout(20000);

  try {
    await waitFor(element(by.text('Resolving address…')))
      .not.toBeVisible()
      .withTimeout(15000);
  } catch {
    // Geocode may finish before the matcher runs.
  }

  await waitFor(element(by.id('location-picker-confirm')))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id('location-picker-confirm')).tap();
  await waitFor(element(by.id('reminder-form-screen')))
    .toBeVisible()
    .withTimeout(8000);

  await scrollFormTo(`form-radius-${radiusPreset}`);
  await element(by.id(`form-radius-${radiusPreset}`)).tap();

  await tapFormSave();
  await dismissAlertIfVisible();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(15000);
  await waitFor(element(by.text(title)))
    .toBeVisible()
    .withTimeout(8000);
};
