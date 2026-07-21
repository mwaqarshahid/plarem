/**
 * Plarem brand mark — "Place Reminder"
 * An alarm clock fused with a place pin: charcoal clock body with alarm bells,
 * a GPS navigation arrow at the center, and a lime pin-tail chevron.
 * Centered in a 128×128 canvas.
 *
 * Visual story: place pin + GPS + alarm = a reminder that rings when you arrive.
 */

const IDENTITY = require('./identity.json');

const C = {
  ink: '#1E2126', // charcoal body
  arrow: '#2B9FD8', // GPS arrow blue
  lime: '#D7DF23', // pin-tail chevron
  white: '#FFFFFF',
  tileLight: '#A2A4A7', // app-icon tile gradient start
  tileDark: '#4B4D52', // app-icon tile gradient end
};

// Kept for backwards compatibility with older callers.
C.primary = C.ink;
C.secondary = C.arrow;

/** Vertical nudge so the visual centroid sits at y=64 */
const CENTER = 'translate(0, 4)';

// Geometry (pre-CENTER): clock body circle, bell arcs, tail chevron, arrow.
const BODY = { cx: 64, cy: 54, r: 30 };
const TAIL_PATH = 'M 40 68 L 88 68 L 64 106 Z';
const BELL_LEFT = 'M 25.4 43.6 A 40 40 0 0 1 47.1 17.7';
const BELL_RIGHT = 'M 80.9 17.7 A 40 40 0 0 1 102.6 43.6';
const ARROW_PATH = 'M 0 -15 L 10.5 12 L 0 5.5 L -10.5 12 Z';
const ARROW_TRANSFORM = `translate(${BODY.cx}, ${BODY.cy}) rotate(42)`;

function bellPaths(color, width = 7) {
  return `<path d="${BELL_LEFT}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>
  <path d="${BELL_RIGHT}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

/** Solid single-color silhouette (no arrow) — used for shadows/notification. */
function silhouettePaths(color) {
  return `${bellPaths(color)}
  <path d="${TAIL_PATH}" fill="${color}"/>
  <circle cx="${BODY.cx}" cy="${BODY.cy}" r="${BODY.r}" fill="${color}"/>`;
}

/**
 * @param {object} opts
 * @param {string} [opts.bodyFill]  clock ball + bells
 * @param {string} [opts.arrowFill] GPS arrow
 * @param {string} [opts.tailFill]  pin-tail chevron
 */
function markPaths(opts = {}) {
  const { bodyFill = C.ink, arrowFill = C.arrow, tailFill = C.lime } = opts;

  return `${bellPaths(bodyFill)}
  <path d="${TAIL_PATH}" fill="${tailFill}"/>
  <circle cx="${BODY.cx}" cy="${BODY.cy}" r="${BODY.r}" fill="${bodyFill}"/>
  <g transform="${ARROW_TRANSFORM}"><path d="${ARROW_PATH}" fill="${arrowFill}"/></g>`;
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

/** Full-color mark used on the app-icon tile (kept name for compatibility). */
function appMarkLight() {
  return markGroup();
}

/** Monochrome mark (single color; the arrow reads as a white gap) */
function markMonochrome(color = C.ink) {
  return markGroup({
    bodyFill: color,
    arrowFill: C.white,
    tailFill: color,
  });
}

/** White mark for dark backgrounds (dark arrow, lime tail) */
function markWhite() {
  return markGroup({
    bodyFill: C.white,
    arrowFill: C.ink,
    tailFill: C.lime,
  });
}

/** Outline-only mark (tail drawn only where it protrudes below the ball) */
function markOutline() {
  return `<g transform="${CENTER}">
  ${bellPaths(C.ink, 5)}
  <path d="M 46.6 78.4 L 64 106 L 81.4 78.4" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/>
  <circle cx="${BODY.cx}" cy="${BODY.cy}" r="${BODY.r}" fill="none" stroke="${C.ink}" stroke-width="3.5"/>
  <g transform="${ARROW_TRANSFORM}"><path d="${ARROW_PATH}" fill="none" stroke="${C.arrow}" stroke-width="3" stroke-linejoin="round"/></g>
</g>`;
}

/** Status-bar notification silhouette (24×24, white, arrow cut out) */
function notificationSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <defs>
    <mask id="arrow-cut">
      <rect x="-32" y="-32" width="192" height="192" fill="#FFFFFF"/>
      <g transform="${ARROW_TRANSFORM}"><path d="${ARROW_PATH}" fill="#000000"/></g>
    </mask>
  </defs>
  <g transform="translate(12, 12) scale(0.185) translate(-64, -60)">
    <g mask="url(#arrow-cut)">${silhouettePaths('#FFFFFF')}</g>
  </g>
</svg>`;
}

/** Adaptive-icon foreground (108×108 safe zone) */
function launcherForegroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" fill="none">
  <g transform="translate(54, 54) scale(0.62) translate(-64, -60)">
    ${markPaths()}
  </g>
</svg>`;
}

/** Long diagonal flat-design shadow cast by the mark toward bottom-right. */
function longShadow(scale) {
  const steps = [];
  for (let i = 1; i <= 70; i += 1) {
    const offset = i * 14;
    steps.push(
      `<g transform="translate(${512 + offset}, ${512 + offset}) scale(${scale}) translate(-64, -60)">${silhouettePaths('#000000')}</g>`,
    );
  }
  return steps.join('\n');
}

function appIconSvg({ rounded = false, flat = false, gradient = true, transparent = false } = {}) {
  const rx = rounded ? 'rx="224"' : '';
  const scale = 7.4;

  if (transparent) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <g transform="translate(512, 512) scale(${scale}) translate(-64, -60)">
    ${markPaths()}
  </g>
</svg>`;
  }

  const bg = gradient && !flat
    ? `<defs>
  <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${C.tileLight}"/>
    <stop offset="100%" stop-color="${C.tileDark}"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="30%" r="60%">
    <stop offset="0%" stop-color="rgba(255,255,255,0.16)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </radialGradient>
  <clipPath id="tile"><rect width="1024" height="1024" ${rx}/></clipPath>
</defs>
<rect width="1024" height="1024" ${rx} fill="url(#bg)"/>
<rect width="1024" height="1024" ${rx} fill="url(#glow)"/>
<g opacity="0.14" clip-path="url(#tile)">
${longShadow(scale)}
</g>`
    : `<rect width="1024" height="1024" ${rx} fill="${C.tileDark}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  ${bg}
  <g transform="translate(512, 512) scale(${scale}) translate(-64, -60)">
    ${markPaths()}
  </g>
</svg>`;
}

function horizontalLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 128" fill="none">
  <g transform="translate(8, 0)">${markGroup()}</g>
  <text x="148" y="62" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" fill="${C.ink}" letter-spacing="-1.5">${IDENTITY.name}</text>
  <text x="150" y="88" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="15" font-weight="500" fill="#5C6070" letter-spacing="0.2">${IDENTITY.motto}</text>
</svg>`;
}

function verticalLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 248" fill="none">
  <g transform="translate(36, 0)">${markGroup()}</g>
  <text x="100" y="196" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="40" font-weight="700" fill="${C.ink}" letter-spacing="-1">${IDENTITY.name}</text>
  <text x="100" y="224" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#5C6070">${IDENTITY.motto}</text>
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

/** Inline mark for splash screens — white-bodied variant on dark splash. */
function splashMarkSvg(onDark = false, size = 128) {
  const opts = onDark
    ? { bodyFill: C.white, arrowFill: C.ink, tailFill: C.lime }
    : {};
  return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" shape-rendering="geometricPrecision">${markGroup(opts)}</svg>`;
}

module.exports = {
  C,
  IDENTITY,
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
