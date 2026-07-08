# Plarem branding kit

Production-ready brand assets for Android and iOS.

## Brand mark — "Arrival Zone"

The Plarem mark tells the product story in one glance:

- **Geofence arc** — Plarem monitors a boundary around a place
- **Place pin** — the location you chose
- **Teal trigger dot** — the moment you arrive and the reminder fires

All SVG masters are generated from a single source of truth: `brand/mark.js`.  
Edit that file, then run `npm run brand:generate`.

## Regenerate everything

```bash
npm run brand:generate
```

This exports PNGs into `brand/export/` and syncs platform assets into:

- `android/app/src/main/res/` (launcher, adaptive icons, notification icons, splash)
- `ios/Plarem/Images.xcassets/` (AppIcon, Splash)

Requires Node.js and the `sharp` dev dependency.

## Brand colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#4F5BE8` | Logo, app icon, accents |
| Secondary | `#00A98F` | Gradients, highlights |
| Light background | `#F6F7FB` | Splash (light) |
| Dark background | `#0F1117` | Splash (dark) |

## 1. Master logos (`brand/svg/`)

| File | Description |
|------|-------------|
| `logo-horizontal.svg` | Icon + wordmark, horizontal |
| `logo-vertical.svg` | Icon above wordmark |
| `logo-icon.svg` | Mark only |
| `logo-monochrome.svg` | Single-color dark |
| `logo-white.svg` | White on transparent |
| `logo-black.svg` | Black on transparent |
| `logo-outline.svg` | Stroke-only mark |

PNG exports: `brand/export/logo/`

## 2. App icon (`brand/export/app-icon/`)

| File | Size | Notes |
|------|------|-------|
| `app-icon-1024.png` | 1024×1024 | Master (gradient) |
| `app-icon-transparent-1024.png` | 1024×1024 | Transparent background |
| `app-icon-rounded-1024.png` | 1024×1024 | Rounded square |
| `app-icon-flat-1024.png` | 1024×1024 | Flat primary fill |
| `app-icon-gradient-1024.png` | 1024×1024 | Primary → secondary gradient |

## 3. Android adaptive icons

| Layer | Location |
|-------|----------|
| Foreground | `mipmap-*/ic_launcher_foreground.png` |
| Solid background | `mipmap-*/ic_launcher_background.png` |
| Gradient background | `mipmap-*/ic_launcher_background_gradient.png` |
| Adaptive XML | `mipmap-anydpi-v26/ic_launcher.xml` |

Background color resource: `values/ic_launcher_background.xml` (`#4F5BE8`)

## 4. Android launcher icons

Legacy `ic_launcher.png` / `ic_launcher_round.png` in all densities:

| Density | Size |
|---------|------|
| mdpi | 48×48 |
| hdpi | 72×72 |
| xhdpi | 96×96 |
| xxhdpi | 144×144 |
| xxxhdpi | 192×192 |

Adaptive foreground canvas sizes: 108 / 162 / 216 / 324 / 432 px.

## 5. iOS AppIcon (`ios/.../AppIcon.appiconset/`)

| File | Pixels |
|------|--------|
| Icon-20.png | 20 |
| Icon-29.png | 29 |
| Icon-40.png | 40 |
| Icon-58.png | 58 |
| Icon-60.png | 60 |
| Icon-76.png | 76 |
| Icon-80.png | 80 |
| Icon-87.png | 87 |
| Icon-120.png | 120 |
| Icon-152.png | 152 |
| Icon-167.png | 167 |
| Icon-180.png | 180 |
| Icon-1024.png | 1024 |

## 6. Splash screens (`brand/export/splash/`)

| Variant | Filename pattern |
|---------|------------------|
| Light portrait phone | `splash-light-portrait-phone.png` (1080×1920) |
| Light landscape phone | `splash-light-landscape-phone.png` (1920×1080) |
| Light portrait tablet | `splash-light-portrait-tablet.png` (2048×2732) |
| Light landscape tablet | `splash-light-landscape-tablet.png` (2732×2048) |
| Dark variants | `splash-dark-*` (same dimensions) |

Synced to Android `drawable/splash.png` + `drawable-night/splash.png`.

## 7. Notification icons

**Design kit (easy to browse):** `brand/export/notification/{density}/`

| Density | Size | Files |
|---------|------|-------|
| mdpi | 24×24 | `ic_notification.png`, `ic_notification_white.png`, `ic_notification_colored.png`, `ic_notification_large.png`, `ic_notification_transparent.png` |
| hdpi | 36×36 | same |
| xhdpi | 48×48 | same |
| xxhdpi | 72×72 | same |
| xxxhdpi | 96×96 | same |

**Android runtime (synced automatically):** `android/app/src/main/res/drawable-{density}/`

**Source SVG:** `brand/svg/ic_notification.svg` (white silhouette for status bar)

The app uses `@drawable/ic_notification` via Notifee (`smallIcon: 'ic_notification'` in `src/services/notifications.ts`).

## 8. Favicons (`brand/export/favicon/`)

16×16, 32×32, 48×48, 64×64 PNG plus `favicon.ico`.

## 9. Store assets (`brand/export/store/`)

| File | Size | Platform |
|------|------|----------|
| `google-play-feature-graphic-1024x500.png` | 1024×500 | Google Play |
| `google-play-icon-512x512.png` | 512×512 | Google Play |
| `app-store-icon-1024x1024.png` | 1024×1024 | App Store |

## Customizing

Edit the SVG files in `brand/svg/`, then run `npm run brand:generate`. Adjust colors in `scripts/generate-brand-assets.js` (`COLORS` constant) if needed.
