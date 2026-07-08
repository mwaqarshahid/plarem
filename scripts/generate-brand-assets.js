#!/usr/bin/env node
/**
 * Generates the full Plarem branding kit from SVG masters.
 * Run: npm run brand:generate
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mark = require('../brand/mark');

const ROOT = path.join(__dirname, '..');
const BRAND = path.join(ROOT, 'brand');
const SVG_DIR = path.join(BRAND, 'svg');
const EXPORT = path.join(BRAND, 'export');

const COLORS = {
  primary: '#4F5BE8',
  secondary: '#00A98F',
  lightBg: '#F6F7FB',
  darkBg: '#0F1117',
  white: '#FFFFFF',
};

const ANDROID_MIPMAP = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const ANDROID_ADAPTIVE = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const ANDROID_NOTIFICATION = {
  mdpi: 24,
  hdpi: 36,
  xhdpi: 48,
  xxhdpi: 72,
  xxxhdpi: 96,
};

const IOS_ICONS = [
  { name: 'Icon-20.png', size: 20 },
  { name: 'Icon-29.png', size: 29 },
  { name: 'Icon-40.png', size: 40 },
  { name: 'Icon-58.png', size: 58 },
  { name: 'Icon-60.png', size: 60 },
  { name: 'Icon-76.png', size: 76 },
  { name: 'Icon-80.png', size: 80 },
  { name: 'Icon-87.png', size: 87 },
  { name: 'Icon-120.png', size: 120 },
  { name: 'Icon-152.png', size: 152 },
  { name: 'Icon-167.png', size: 167 },
  { name: 'Icon-180.png', size: 180 },
  { name: 'Icon-1024.png', size: 1024 },
];

const ensureDir = dir => fs.mkdirSync(dir, { recursive: true });

const svgPath = name => path.join(SVG_DIR, name);

const renderSvg = async (input, output, size, options = {}) => {
  ensureDir(path.dirname(output));
  let pipeline = sharp(input, { density: 300 }).resize(size, size, {
    fit: 'contain',
    background: options.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (options.flatten) {
    pipeline = pipeline.flatten({ background: options.flatten });
  }
  await pipeline.png().toFile(output);
};

const renderSvgRect = async (input, output, width, height, options = {}) => {
  ensureDir(path.dirname(output));
  let pipeline = sharp(input, { density: 300 }).resize(width, height, {
    fit: 'contain',
    background: options.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (options.flatten) {
    pipeline = pipeline.flatten({ background: options.flatten });
  }
  await pipeline.png().toFile(output);
};

const solidSvg = (color, width, height) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`,
  );

const gradientSvg = (width, height) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.primary}"/>
      <stop offset="100%" stop-color="${COLORS.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);

const splashSvg = (mode, orientation, formFactor) => {
  const isDark = mode === 'dark';
  const bg = isDark ? COLORS.darkBg : COLORS.lightBg;
  const isLandscape = orientation === 'landscape';
  const isTablet = formFactor === 'tablet';
  const width = isLandscape ? (isTablet ? 2732 : 1920) : isTablet ? 2048 : 1080;
  const height = isLandscape ? (isTablet ? 2048 : 1080) : isTablet ? 2732 : 1920;
  const logoSize = isTablet ? 300 : 260;
  const subtitle = isDark ? '#A3A7B8' : '#5C6070';
  const subtitleY = height / 2 + (isTablet ? 108 : 96);
  const logoY = height / 2 - logoSize / 2 - 48;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g transform="translate(${width / 2 - logoSize / 2}, ${logoY})">
    ${mark.splashMarkSvg(COLORS.primary, COLORS.secondary, logoSize)}
  </g>
  <text x="${width / 2}" y="${height / 2 + 40}" text-anchor="middle"
    font-family="Segoe UI, system-ui, sans-serif" font-size="${isTablet ? 56 : 44}" font-weight="700"
    fill="${isDark ? '#E9EAF2' : '#171A23'}">Plarem</text>
  <text x="${width / 2}" y="${subtitleY}" text-anchor="middle"
    font-family="Segoe UI, system-ui, sans-serif" font-size="${isTablet ? 24 : 18}"
    fill="${subtitle}">Arrive. Remember.</text>
</svg>`);
};

const copyFile = (src, dest) => {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
};

const writeJson = (file, data) => {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
};

async function exportLogos() {
  const out = path.join(EXPORT, 'logo');
  const logos = [
    'logo-horizontal.svg',
    'logo-vertical.svg',
    'logo-icon.svg',
    'logo-monochrome.svg',
    'logo-white.svg',
    'logo-black.svg',
    'logo-outline.svg',
  ];
  for (const logo of logos) {
    const base = logo.replace('.svg', '');
    const input = svgPath(logo);
    if (logo.includes('horizontal')) {
      await renderSvgRect(input, path.join(out, `${base}.png`), 840, 256, {
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      });
      await renderSvgRect(input, path.join(out, `${base}@2x.png`), 1680, 512, {
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      });
    } else if (logo.includes('vertical')) {
      await renderSvgRect(input, path.join(out, `${base}.png`), 400, 480, {
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      });
    } else {
      await renderSvg(input, path.join(out, `${base}.png`), 512);
      await renderSvg(input, path.join(out, `${base}@2x.png`), 1024);
    }
  }
}

async function exportAppIcons() {
  const out = path.join(EXPORT, 'app-icon');
  const variants = [
    ['app-icon-master.svg', 'app-icon-1024.png'],
    ['app-icon-transparent.svg', 'app-icon-transparent-1024.png'],
    ['app-icon-rounded.svg', 'app-icon-rounded-1024.png'],
    ['app-icon-flat.svg', 'app-icon-flat-1024.png'],
    ['app-icon-gradient.svg', 'app-icon-gradient-1024.png'],
  ];
  for (const [svg, png] of variants) {
    await renderSvg(svgPath(svg), path.join(out, png), 1024, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }
}

async function exportAndroid() {
  const out = path.join(EXPORT, 'android');
  const master = svgPath('app-icon-gradient.svg');

  for (const [density, size] of Object.entries(ANDROID_MIPMAP)) {
    const dir = path.join(out, 'mipmap', `mipmap-${density}`);
    await renderSvg(master, path.join(dir, 'ic_launcher.png'), size, {
      flatten: COLORS.primary,
    });
    await renderSvg(master, path.join(dir, 'ic_launcher_round.png'), size, {
      flatten: COLORS.primary,
    });
  }

  for (const [density, size] of Object.entries(ANDROID_ADAPTIVE)) {
    const dir = path.join(out, 'mipmap', `mipmap-${density}`);
    await renderSvg(svgPath('ic_launcher_foreground.svg'), path.join(dir, 'ic_launcher_foreground.png'), size, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    await renderSvg(solidSvg(COLORS.primary, size, size), path.join(dir, 'ic_launcher_background.png'), size);
    await renderSvg(gradientSvg(size, size), path.join(dir, 'ic_launcher_background_gradient.png'), size);
  }

  ensureDir(path.join(out, 'values'));
  fs.writeFileSync(
    path.join(out, 'values', 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${COLORS.primary}</color>\n</resources>\n`,
  );

  ensureDir(path.join(out, 'mipmap-anydpi-v26'));
  fs.writeFileSync(
    path.join(out, 'mipmap-anydpi-v26', 'ic_launcher.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`,
  );
  fs.writeFileSync(
    path.join(out, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`,
  );

  for (const [density, size] of Object.entries(ANDROID_NOTIFICATION)) {
    const androidDir = path.join(out, 'drawable', `drawable-${density}`);
    const kitDir = path.join(EXPORT, 'notification', density);
    for (const targetDir of [androidDir, kitDir]) {
      await renderSvg(svgPath('ic_notification.svg'), path.join(targetDir, 'ic_notification.png'), size, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
      await renderSvg(svgPath('ic_notification.svg'), path.join(targetDir, 'ic_notification_white.png'), size, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
      await renderSvg(svgPath('logo-icon.svg'), path.join(targetDir, 'ic_notification_colored.png'), size, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
      await renderSvg(svgPath('logo-icon.svg'), path.join(targetDir, 'ic_notification_large.png'), size * 2, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
      await renderSvg(svgPath('logo-icon.svg'), path.join(targetDir, 'ic_notification_transparent.png'), size, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }
  }
}

async function exportIos() {
  const out = path.join(EXPORT, 'ios', 'AppIcon.appiconset');
  const master = svgPath('app-icon-gradient.svg');
  for (const icon of IOS_ICONS) {
    await renderSvg(master, path.join(out, icon.name), icon.size);
  }

  writeJson(path.join(out, 'Contents.json'), {
    images: [
      { size: '20x20', idiom: 'iphone', filename: 'Icon-40.png', scale: '2x' },
      { size: '20x20', idiom: 'iphone', filename: 'Icon-60.png', scale: '3x' },
      { size: '29x29', idiom: 'iphone', filename: 'Icon-58.png', scale: '2x' },
      { size: '29x29', idiom: 'iphone', filename: 'Icon-87.png', scale: '3x' },
      { size: '40x40', idiom: 'iphone', filename: 'Icon-80.png', scale: '2x' },
      { size: '40x40', idiom: 'iphone', filename: 'Icon-120.png', scale: '3x' },
      { size: '60x60', idiom: 'iphone', filename: 'Icon-120.png', scale: '2x' },
      { size: '60x60', idiom: 'iphone', filename: 'Icon-180.png', scale: '3x' },
      { size: '20x20', idiom: 'ipad', filename: 'Icon-20.png', scale: '1x' },
      { size: '20x20', idiom: 'ipad', filename: 'Icon-40.png', scale: '2x' },
      { size: '29x29', idiom: 'ipad', filename: 'Icon-29.png', scale: '1x' },
      { size: '29x29', idiom: 'ipad', filename: 'Icon-58.png', scale: '2x' },
      { size: '40x40', idiom: 'ipad', filename: 'Icon-40.png', scale: '1x' },
      { size: '40x40', idiom: 'ipad', filename: 'Icon-80.png', scale: '2x' },
      { size: '76x76', idiom: 'ipad', filename: 'Icon-76.png', scale: '1x' },
      { size: '76x76', idiom: 'ipad', filename: 'Icon-152.png', scale: '2x' },
      { size: '83.5x83.5', idiom: 'ipad', filename: 'Icon-167.png', scale: '2x' },
      { size: '1024x1024', idiom: 'ios-marketing', filename: 'Icon-1024.png', scale: '1x' },
    ],
    info: { version: 1, author: 'xcode' },
  });
}

async function exportSplash() {
  const out = path.join(EXPORT, 'splash');
  ensureDir(out);
  const combos = [
    ['light', 'portrait', 'phone'],
    ['light', 'landscape', 'phone'],
    ['light', 'portrait', 'tablet'],
    ['light', 'landscape', 'tablet'],
    ['dark', 'portrait', 'phone'],
    ['dark', 'landscape', 'phone'],
    ['dark', 'portrait', 'tablet'],
    ['dark', 'landscape', 'tablet'],
  ];
  for (const [mode, orientation, formFactor] of combos) {
    const svg = splashSvg(mode, orientation, formFactor);
    const file = path.join(out, `splash-${mode}-${orientation}-${formFactor}.png`);
    await sharp(svg).png({ compressionLevel: 9 }).toFile(file);
    // Also create @2x naming alias for phone portrait light/dark used in native projects
    if (formFactor === 'phone' && orientation === 'portrait') {
      copyFile(file, path.join(out, `splash-${mode}-phone.png`));
    }
  }
}

async function exportFavicon() {
  const out = path.join(EXPORT, 'favicon');
  ensureDir(out);
  const master = svgPath('logo-icon.svg');
  for (const size of [16, 32, 48, 64]) {
    await renderSvg(master, path.join(out, `favicon-${size}x${size}.png`), size, {
      flatten: COLORS.lightBg,
    });
  }
  await renderSvg(master, path.join(out, 'favicon.ico'), 32, { flatten: COLORS.lightBg });
}

async function exportStore() {
  const out = path.join(EXPORT, 'store');
  ensureDir(out);
  await renderSvgRect(
    svgPath('logo-horizontal.svg'),
    path.join(out, 'google-play-feature-graphic-1024x500.png'),
    1024,
    500,
    { flatten: COLORS.primary },
  );
  await renderSvg(svgPath('app-icon-gradient.svg'), path.join(out, 'google-play-icon-512x512.png'), 512, {
    flatten: COLORS.primary,
  });
  await renderSvg(svgPath('app-icon-gradient.svg'), path.join(out, 'app-store-icon-1024x1024.png'), 1024, {
    flatten: COLORS.primary,
  });
}

function syncToNativeProjects() {
  const androidRes = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
  const androidExport = path.join(EXPORT, 'android');
  const iosAssets = path.join(ROOT, 'ios', 'Plarem', 'Images.xcassets');

  const copyTree = (srcDir, destDir) => {
    if (!fs.existsSync(srcDir)) {
      return;
    }
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const src = path.join(srcDir, entry.name);
      const dest = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        copyTree(src, dest);
      } else {
        copyFile(src, dest);
      }
    }
  };

  copyTree(path.join(androidExport, 'mipmap'), androidRes);
  copyTree(path.join(androidExport, 'drawable'), androidRes);
  copyTree(path.join(androidExport, 'values'), path.join(androidRes, 'values'));
  if (fs.existsSync(path.join(androidExport, 'mipmap-anydpi-v26'))) {
    copyTree(path.join(androidExport, 'mipmap-anydpi-v26'), path.join(androidRes, 'mipmap-anydpi-v26'));
  }

  copyTree(path.join(EXPORT, 'ios', 'AppIcon.appiconset'), path.join(iosAssets, 'AppIcon.appiconset'));

  const splashLight = path.join(EXPORT, 'splash', 'splash-light-phone.png');
  const splashDark = path.join(EXPORT, 'splash', 'splash-dark-phone.png');
  ensureDir(path.join(androidRes, 'drawable'));
  copyFile(splashLight, path.join(androidRes, 'drawable', 'splash.png'));
  copyFile(splashDark, path.join(androidRes, 'drawable-night', 'splash.png'));

  ensureDir(path.join(iosAssets, 'Splash.imageset'));
  copyFile(splashLight, path.join(iosAssets, 'Splash.imageset', 'splash-light.png'));
  copyFile(splashDark, path.join(iosAssets, 'Splash.imageset', 'splash-dark.png'));
  writeJson(path.join(iosAssets, 'Splash.imageset', 'Contents.json'), {
    images: [
      { filename: 'splash-light.png', idiom: 'universal', scale: '1x' },
      { filename: 'splash-light.png', idiom: 'universal', scale: '2x' },
      { filename: 'splash-light.png', idiom: 'universal', scale: '3x' },
      {
        appearances: [{ appearance: 'luminosity', value: 'dark' }],
        filename: 'splash-dark.png',
        idiom: 'universal',
        scale: '1x',
      },
      {
        appearances: [{ appearance: 'luminosity', value: 'dark' }],
        filename: 'splash-dark.png',
        idiom: 'universal',
        scale: '2x',
      },
      {
        appearances: [{ appearance: 'luminosity', value: 'dark' }],
        filename: 'splash-dark.png',
        idiom: 'universal',
        scale: '3x',
      },
    ],
    info: { version: 1, author: 'xcode' },
  });
}

const writeBrandSvgs = () => {
  const files = {
    'logo-icon.svg': mark.iconSvg(),
    'logo-horizontal.svg': mark.horizontalLogoSvg(),
    'logo-vertical.svg': mark.verticalLogoSvg(),
    'logo-monochrome.svg': mark.monochromeSvg(),
    'logo-white.svg': mark.whiteSvg(),
    'logo-black.svg': mark.blackSvg(),
    'logo-outline.svg': mark.outlineSvg(),
    'app-icon-master.svg': mark.appIconSvg({ gradient: true }),
    'app-icon-gradient.svg': mark.appIconSvg({ gradient: true }),
    'app-icon-flat.svg': mark.appIconSvg({ flat: true, gradient: false }),
    'app-icon-rounded.svg': mark.appIconSvg({ rounded: true, gradient: true }),
    'app-icon-transparent.svg': mark.appIconSvg({ transparent: true }),
    'ic_launcher_foreground.svg': mark.launcherForegroundSvg(),
    'ic_notification.svg': mark.notificationSvg(),
  };
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(SVG_DIR, name), `${content.trim()}\n`);
  }
};

async function main() {
  ensureDir(EXPORT);
  console.log('Writing SVG masters from brand/mark.js…');
  writeBrandSvgs();
  console.log('Exporting logo PNGs…');
  await exportLogos();
  console.log('Exporting app icon variants…');
  await exportAppIcons();
  console.log('Exporting Android assets…');
  await exportAndroid();
  console.log('Exporting iOS AppIcon set…');
  await exportIos();
  console.log('Exporting splash screens…');
  await exportSplash();
  console.log('Exporting favicons…');
  await exportFavicon();
  console.log('Exporting store assets…');
  await exportStore();
  console.log('Syncing into android/ and ios/…');
  syncToNativeProjects();
  console.log('Done. See brand/export/ and native projects.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
