# Plarem - Play a Reminder on Arrival

Plarem is a location-based reminder app for Android and iOS built with React Native. Attach a task to a place and Plarem notifies you the moment you arrive. The location itself becomes the trigger.

## How it works

1. You create a reminder with a title, location, and arrival radius.
2. Plarem registers a **geofence with the operating system** (Google Play Services `GeofencingClient` on Android, `CLLocationManager` region monitoring on iOS). No continuous GPS polling, so battery impact is minimal.
3. When the device enters the radius — even if the app is closed — the OS wakes Plarem in the background (headless JS on Android) and a local notification is shown via Notifee.
4. Tapping the notification opens the reminder.

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

The same `.env` value is used for native map tiles (Android manifest / iOS Info.plist) and for JS place search + geocoding. Run `npm run android` (or `ios`) after changing the key so native builds pick it up.

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

## Permissions

Geofencing requires:

- **Location — "Allow all the time"** (Android 10+) or **Always** (iOS). Without background location, reminders only trigger while the app is open.
- **Notifications** (Android 13+ / iOS).

The app requests these when you save your first enabled reminder, and the Settings screen shows their current state.

## Testing geofences

- Android emulator: set a route or single location in the emulator's Extended Controls → Location.
- Expect up to ~2 minutes of latency after entering a fence (OS batching); this is normal geofencing behavior.
- Radii below ~100 m are unreliable outdoors; presets start at 100 m.

## Roadmap (not in MVP)

Authentication and cloud sync (the data layer is local-first by design), departure triggers, recurring schedules, shared reminders, wearables, widgets and voice input.
