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
