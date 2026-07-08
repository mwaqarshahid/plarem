/**
 * Plarem brand mark — "Arrival Zone"
 * Geofence arc + place pin + trigger dot. Centered in a 128×128 canvas.
 *
 * Visual story: Plarem watches a boundary around a place and reminds you on arrival.
 */

const C = {
  primary: '#4F5BE8',
  secondary: '#00A98F',
  primaryDark: '#3A44B8',
  white: '#FFFFFF',
  ink: '#171A23',
};

/** Vertical nudge so the visual centroid sits at y=64 */
const CENTER = 'translate(0, 7)';

/**
 * @param {object} opts
 * @param {string} [opts.pinFill]
 * @param {string} [opts.arcOuter]
 * @param {string} [opts.arcInner]
 * @param {string} [opts.discFill]
 * @param {string} [opts.dotFill]
 * @param {boolean} [opts.showPulse]
 */
function markPaths(opts = {}) {
  const {
    pinFill = C.primary,
    arcOuter = C.secondary,
    arcInner = C.primary,
    discFill = C.white,
    dotFill = C.secondary,
    showPulse = true,
  } = opts;

  const pulse = showPulse
    ? `<path d="M 30 54 A 34 34 0 1 1 98 54" fill="none" stroke="${arcOuter}" stroke-width="2" stroke-linecap="round" opacity="0.22"/>`
    : '';

  return `${pulse}
  <path d="M 34 54 A 30 30 0 1 1 94 54" fill="none" stroke="${arcOuter}" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/>
  <path d="M 39 54 A 25 25 0 1 1 89 54" fill="none" stroke="${arcInner}" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
  <path d="M64 24 C49.5 24 39 35 39 48.5 C39 55.5 48.5 67 64 91 C79.5 67 89 55.5 89 48.5 C89 35 78.5 24 64 24 Z" fill="${pinFill}"/>
  <circle cx="64" cy="47" r="11.5" fill="${discFill}" opacity="0.96"/>
  <circle cx="64" cy="47" r="5" fill="${dotFill}"/>`;
}

function markGroup(opts = {}) {
  return `<g transform="${CENTER}">${markPaths(opts)}</g>`;
}

/** Full-color mark on transparent background */
function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  ${markGroup()}
</svg>`;
}

/** Mark for gradient / flat app icons (light pin on colored bg) */
function appMarkLight({ showPulse = true } = {}) {
  return markGroup({
    pinFill: C.white,
    arcOuter: '#B8FFF0',
    arcInner: 'rgba(255,255,255,0.35)',
    discFill: C.primary,
    dotFill: '#B8FFF0',
    showPulse,
  });
}

/** Monochrome mark */
function markMonochrome(color = C.ink) {
  return markGroup({
    pinFill: color,
    arcOuter: color,
    arcInner: color,
    discFill: C.white,
    dotFill: color,
    showPulse: false,
  });
}

/** White mark for dark backgrounds */
function markWhite() {
  return markGroup({
    pinFill: C.white,
    arcOuter: C.white,
    arcInner: C.white,
    discFill: C.primary,
    dotFill: C.white,
    showPulse: false,
  });
}

/** Outline-only mark */
function markOutline() {
  return `<g transform="${CENTER}">
  <path d="M 34 54 A 30 30 0 1 1 94 54" fill="none" stroke="${C.primary}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M64 24 C49.5 24 39 35 39 48.5 C39 55.5 48.5 67 64 91 C79.5 67 89 55.5 89 48.5 C89 35 78.5 24 64 24 Z" fill="none" stroke="${C.primary}" stroke-width="3.5" stroke-linejoin="round"/>
  <circle cx="64" cy="47" r="11.5" fill="none" stroke="${C.primary}" stroke-width="3"/>
  <circle cx="64" cy="47" r="5" fill="none" stroke="${C.secondary}" stroke-width="2.5"/>
</g>`;
}

/** Status-bar notification silhouette (24×24, white) */
function notificationSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <g transform="translate(12, 12.2) scale(0.11) translate(-64, -57)">
    <path d="M64 24 C49.5 24 39 35 39 48.5 C39 55.5 48.5 67 64 91 C79.5 67 89 55.5 89 48.5 C89 35 78.5 24 64 24 Z" fill="#FFFFFF"/>
    <circle cx="64" cy="47" r="11.5" fill="#FFFFFF" opacity="0.28"/>
  </g>
</svg>`;
}

/** Adaptive-icon foreground (108×108 safe zone) */
function launcherForegroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" fill="none">
  <g transform="translate(54, 54) scale(0.72) translate(-64, -64)">
    ${appMarkLight()}
  </g>
</svg>`;
}

function appIconSvg({ rounded = false, flat = false, gradient = true, transparent = false } = {}) {
  const bg = transparent
    ? ''
    : gradient
      ? `<defs>
  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${C.primary}"/>
    <stop offset="55%" stop-color="#5B66EA"/>
    <stop offset="100%" stop-color="${C.secondary}"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="42%" r="50%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </radialGradient>
</defs>
<rect width="1024" height="1024" ${rounded ? 'rx="224"' : ''} fill="${flat ? C.primary : 'url(#bg)'}"/>
<rect width="1024" height="1024" ${rounded ? 'rx="224"' : ''} fill="url(#glow)"/>`
      : `<rect width="1024" height="1024" ${rounded ? 'rx="224"' : ''} fill="${C.primary}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  ${bg}
  <g transform="translate(512, 512) scale(4) translate(-64, -64)">
    ${appMarkLight()}
  </g>
</svg>`;
}

function horizontalLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 128" fill="none">
  <g transform="translate(8, 0)">${markGroup()}</g>
  <text x="148" y="62" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" fill="${C.ink}" letter-spacing="-1.5">Plarem</text>
  <text x="150" y="88" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="15" font-weight="500" fill="#5C6070" letter-spacing="0.2">Arrive. Remember.</text>
</svg>`;
}

function verticalLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 248" fill="none">
  <g transform="translate(36, 0)">${markGroup()}</g>
  <text x="100" y="196" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="40" font-weight="700" fill="${C.ink}" letter-spacing="-1">Plarem</text>
  <text x="100" y="224" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#5C6070">Arrive. Remember.</text>
</svg>`;
}

function wrap128(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">${body}</svg>`;
}

function monochromeSvg() {
  return wrap128(markMonochrome());
}

function blackSvg() {
  return wrap128(markMonochrome('#000000'));
}

function whiteSvg() {
  return wrap128(markWhite());
}

function outlineSvg() {
  return wrap128(markOutline());
}

/** Inline mark for splash screens */
function splashMarkSvg(primary = C.primary, secondary = C.secondary, size = 128) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" shape-rendering="geometricPrecision">${markGroup({
    pinFill: primary,
    arcOuter: secondary,
    arcInner: primary,
    discFill: C.white,
    dotFill: secondary,
  })}</svg>`;
}

module.exports = {
  C,
  CENTER,
  markGroup,
  markPaths,
  iconSvg,
  appMarkLight,
  markMonochrome,
  markWhite,
  markOutline,
  notificationSvg,
  launcherForegroundSvg,
  appIconSvg,
  horizontalLogoSvg,
  verticalLogoSvg,
  monochromeSvg,
  blackSvg,
  whiteSvg,
  outlineSvg,
  splashMarkSvg,
};
