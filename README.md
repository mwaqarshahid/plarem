# Plarem - Play a Reminder on Arrival

Plarem is a location-based reminder app for Android and iOS built with React Native. Attach a task to a place and Plarem notifies you the moment you arrive. The location itself becomes the trigger.

## How it works

1. You create a reminder with a title, location, and arrival radius.
2. Plarem registers a **geofence with the operating system** (Google Play Services `GeofencingClient` on Android, `CLLocationManager` region monitoring on iOS).
3. While you have active reminders, Android runs a **low-power foreground location service** (`FusedLocationProviderClient`, balanced-power). This keeps the process alive and feeds the OS fresh fixes so geofence transitions fire within seconds instead of being missed while you drive through a fence. A software distance-check runs off the same location stream as a fallback, independent of Play Services.
4. When the device enters the radius — even if the app is closed — Plarem is woken in the background (headless JS on Android) and a local notification is shown via Notifee.
5. Tapping the notification opens the reminder.

> **Why the foreground service?** Play Services geofencing is *opportunistic* — it only re-evaluates fences when the OS happens to receive a location fix. With no active location client and the app killed (or throttled by an OEM battery manager), fixes can be minutes apart, so a fence driven through at speed is frequently never sampled. Holding a live, low-power location request is the documented fix and is what dedicated (paid) background-geolocation libraries do internally.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | React Native 0.86 (CLI) + TypeScript strict | Background geofencing needs native OS APIs; CLI keeps full native control |
| Geofencing | `@rn-org/react-native-geofencing` | Wraps the free, battery-efficient OS geofencing APIs; supports headless background triggers. Avoids the ~$400 license of `react-native-background-geolocation` |
| Notifications | Notifee | Free, best-in-class local notifications (channels, sounds, background events) |
| Maps | `react-native-maps` (Google provider) + Places/Geocoding HTTP APIs | Standard, actively maintained |
| State | Redux Toolkit | Predictable state, minimal boilerplate |
| Storage | MMKV (v4, Nitro) | Reminders are small structured records; MMKV is faster and simpler than SQLite at this scale, with an easy migration path if data grows |
| Navigation | React Navigation 7 (native stack + bottom tabs) | De-facto standard |
| Permissions | `react-native-permissions` | Unified cross-platform permission flow |

## Project structure

```
src/
  components/    Reusable UI (Button, Card, Chip, TextField, ReminderCard, …)
  screens/       Home, ReminderForm, ReminderDetails, LocationPicker, Settings
  navigation/    Root stack + tabs, typed route params
  services/      geofencing, notifications, permissions, location, places
  store/         Redux Toolkit slices + selectors (MMKV-persisted)
  storage/       MMKV wrapper
  theme/         Colors, spacing, typography, light/dark ThemeProvider
  constants/     Categories, radius presets, config
  hooks/         Typed store hooks
  types/         Domain models (Reminder, …)
  utils/         id, geo (haversine), date helpers
```

## Setup

### Prerequisites

- Node >= 22, JDK 17+, Android SDK (for Android)
- macOS + Xcode + CocoaPods (for iOS — cannot be built on Windows)

### Install

```bash
npm install
```

### Google Maps API key

1. Copy `.env.example` to `.env`.
2. Paste your key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```bash
GOOGLE_MAPS_API_KEY=your_key_here
```

3. Enable these APIs for that key: **Maps SDK for Android**, **Places API**, and **Geocoding API** (plus **Maps SDK for iOS** if you build for iOS).

The same `.env` value is synced at build time into generated, gitignored files (`src/constants/env.generated.ts`, `ios/Plarem/GoogleMapsApiKey.plist`) and into the Android manifest via Gradle. **Never commit `.env` or run `git add` after `npm start` / `sync-env` without checking for stamped secrets.** Run `npm run android` (or `ios`) after changing the key so native builds pick it up.

### Run (Android)

```bash
npm run android
```

### Run (iOS, on macOS)

```bash
cd ios && bundle exec pod install && cd ..
npm run ios
```

### Test / lint / type-check

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Testing (Detox E2E)

This repo includes **Detox** end-to-end tests under `e2e/`. They run against a **real attached Android device** or an **Android emulator**.

### Prerequisites

- Install dependencies:

```bash
npm install
```

- Make sure **Metro is running** and reachable from the device:
  - For a real device: use `adb reverse` so the device can access `localhost:8081` on your computer.

### Run on a real Android device (attached)

1. Connect the phone and verify ADB sees it:

```bash
adb devices
```

2. Reverse the Metro port and start Metro:

```bash
adb reverse tcp:8081 tcp:8081
npm run start
```

3. Build the debug + test APKs (only needed after native changes or a clean build):

```bash
npm run e2e:build:android:att
```

4. Run the tests:

```bash
# Optional, but recommended if you have multiple devices connected:
# PowerShell:
$env:ANDROID_SERIAL='YOUR_DEVICE_SERIAL'

npm run e2e:android:att
```

### Run on an Android emulator

```bash
npm run e2e:build:android
npm run e2e:android
```

### Notes / troubleshooting

- **Metro port already in use (`EADDRINUSE 8081`)**: another Metro instance is running. Close it or reuse it; Detox only needs Metro to be running once.
- **Device can’t reach Metro**: re-run `adb reverse tcp:8081 tcp:8081` (and ensure the phone is connected).
- **Permissions dialogs**: Detox installs the app fresh for some suites; the test runner grants runtime permissions automatically, but OEM permission UIs can still vary.

## Permissions

Geofencing requires:

- **Location — "Allow all the time"** (Android 10+) or **Always** (iOS). Without background location, reminders only trigger while the app is open.
- **Notifications** (Android 13+ / iOS).
- **Background activity / battery-optimization exemption** (Android). Requested during onboarding. Many OEMs (Samsung, Xiaomi, Oppo, etc.) aggressively kill background apps; without this, the monitoring service can be stopped and reminders will be missed.

The app requests these during onboarding, and the Settings screen shows their current state.

## Testing geofences

- Android emulator: set a route or single location in the emulator's Extended Controls → Location. Drive a **route** (not a single teleport) so the foreground service and the software fallback both get a stream of fixes.
- With the foreground service active, transitions typically fire within seconds; without an active location client, Play Services geofencing alone can lag several minutes or miss a drive-through entirely.
- Radii below ~100 m are unreliable outdoors; presets start at 100 m.
- Confirm registration: `syncGeofences` records a `GeofenceSyncReport` (see `getLastGeofenceSyncReport`) listing any reminders the OS refused to arm.

## Roadmap (not in MVP)

Authentication and cloud sync (the data layer is local-first by design), departure triggers, recurring schedules, shared reminders, wearables, widgets and voice input.
