#!/usr/bin/env node
/**
 * Synthesizes the notification tones shipped with the app
 * (android/app/src/main/res/raw/*.wav). Run once when tones change:
 *   node scripts/generate-tones.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function tone(frequency, durationSec, { decay = 6, delaySec = 0, gain = 1 } = {}) {
  const total = Math.floor(SAMPLE_RATE * (delaySec + durationSec));
  const delaySamples = Math.floor(SAMPLE_RATE * delaySec);
  const samples = new Float64Array(total);
  for (let i = delaySamples; i < total; i++) {
    const t = (i - delaySamples) / SAMPLE_RATE;
    const envelope = Math.exp(-decay * t) * Math.min(1, t * 200); // fast attack
    samples[i] = gain * envelope * Math.sin(2 * Math.PI * frequency * t);
  }
  return samples;
}

function mix(...tracks) {
  const length = Math.max(...tracks.map(t => t.length));
  const out = new Float64Array(length);
  for (const track of tracks) {
    for (let i = 0; i < track.length; i++) {
      out[i] += track[i];
    }
  }
  // Normalize to 0.85 peak.
  let peak = 0;
  for (const sample of out) {
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak > 0) {
    for (let i = 0; i < out.length; i++) {
      out[i] = (out[i] / peak) * 0.85;
    }
  }
  return out;
}

const rawDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'raw');
fs.mkdirSync(rawDir, { recursive: true });

// Chime: two ascending glassy notes (C6 then E6) with sparkle an octave up.
writeWav(
  path.join(rawDir, 'chime.wav'),
  mix(
    tone(1046.5, 1.0, { decay: 5 }),
    tone(2093.0, 1.0, { decay: 7, gain: 0.3 }),
    tone(1318.5, 1.1, { decay: 5, delaySec: 0.18 }),
    tone(2637.0, 1.1, { decay: 7, delaySec: 0.18, gain: 0.3 }),
  ),
);

// Bell: single strike with inharmonic partials and a long tail.
writeWav(
  path.join(rawDir, 'bell.wav'),
  mix(
    tone(660, 1.6, { decay: 3 }),
    tone(660 * 2.74, 1.6, { decay: 5, gain: 0.5 }),
    tone(660 * 5.4, 1.6, { decay: 8, gain: 0.25 }),
    tone(660 * 0.5, 1.6, { decay: 2.5, gain: 0.4 }),
  ),
);

console.log('Wrote chime.wav and bell.wav to', rawDir);
